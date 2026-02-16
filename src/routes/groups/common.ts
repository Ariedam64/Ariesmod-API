import { query } from "../../db";
import { pushUnifiedEvent } from "../events/hub";
import { CONNECTED_TTL_MS } from "../messages/common";

export const GROUP_MAX_MEMBERS = 100;
export const GROUP_NAME_MAX = 40;

export type GroupAccess = {
  groupId: number;
  name: string;
  ownerId: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  role: string | null;
};

export type GroupRole = "owner" | "admin" | "member";

const ROLE_RANK: Record<string, number> = {
  owner: 3,
  admin: 2,
  member: 1,
};

export function outranks(actorRole: string, targetRole: string): boolean {
  return (ROLE_RANK[actorRole] ?? 0) > (ROLE_RANK[targetRole] ?? 0);
}

export function canManageMembers(role: string | null): boolean {
  return role === "owner" || role === "admin";
}

export function isOwner(role: string | null): boolean {
  return role === "owner";
}

export function isValidAssignableRole(
  role: string,
): role is "admin" | "member" {
  return role === "admin" || role === "member";
}

export function parseGroupId(raw: string | undefined): number | null {
  if (!raw) return null;
  const id = Number(raw);
  if (!Number.isFinite(id) || id <= 0) return null;
  return Math.floor(id);
}

export async function getGroupAccess(
  groupId: number,
  playerId: string,
): Promise<GroupAccess | null> {
  const { rows } = await query<{
    id: number;
    name: string;
    owner_id: string;
    is_public: boolean;
    created_at: string;
    updated_at: string;
    role: string | null;
  }>(
    `
    select
      g.id,
      g.name,
      g.owner_id,
      g.is_public,
      g.created_at,
      g.updated_at,
      gm.role
    from public.groups g
    left join public.group_members gm
      on gm.group_id = g.id
      and gm.player_id = $2
    where g.id = $1
    limit 1
    `,
    [groupId, playerId],
  );

  const row = rows[0];
  if (!row) return null;
  return {
    groupId: row.id,
    name: row.name,
    ownerId: row.owner_id,
    isPublic: row.is_public,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    role: row.role ?? null,
  };
}

export async function getGroupMemberIds(groupId: number): Promise<string[]> {
  const { rows } = await query<{ player_id: string }>(
    `
    select player_id
    from public.group_members
    where group_id = $1
    `,
    [groupId],
  );

  return (rows ?? [])
    .map((row) => row.player_id)
    .filter((id) => typeof id === "string" && id.length > 0);
}

export async function getGroupMemberCount(groupId: number): Promise<number> {
  const { rows } = await query<{ count: string }>(
    `
    select count(*)::text as count
    from public.group_members
    where group_id = $1
    `,
    [groupId],
  );
  const count = Number(rows[0]?.count ?? "0");
  return Number.isFinite(count) ? count : 0;
}

export async function getMemberRole(
  groupId: number,
  playerId: string,
): Promise<string | null> {
  const { rows } = await query<{ role: string }>(
    `
    select role
    from public.group_members
    where group_id = $1
      and player_id = $2
    limit 1
    `,
    [groupId, playerId],
  );
  return rows[0]?.role ?? null;
}

export async function getPlayerInfo(
  playerId: string,
): Promise<{
  playerId: string;
  name: string;
  avatar: unknown;
  avatarUrl: string | null;
} | null> {
  const { rows } = await query<{
    id: string;
    name: string | null;
    avatar: unknown;
    avatar_url: string | null;
  }>(
    `
    select id, name, avatar, avatar_url
    from public.players
    where id = $1
    limit 1
    `,
    [playerId],
  );
  const row = rows[0];
  if (!row) return null;
  return {
    playerId: row.id,
    name: row.name ?? row.id,
    avatar: row.avatar ?? null,
    avatarUrl: row.avatar_url ?? null,
  };
}

export async function getGroupMembersDetailed(
  groupId: number,
): Promise<
  Array<{
    playerId: string;
    name: string;
    avatarUrl: string | null;
    avatar: unknown;
    lastEventAt: string | null;
    roomId: string | null;
    isOnline: boolean;
    role: string;
    joinedAt: string;
  }>
> {
  const { rows } = await query<{
    player_id: string;
    role: string;
    joined_at: string;
    name: string | null;
    avatar_url: string | null;
    avatar: unknown;
    last_event_at: string | null;
    room_id: string | null;
    is_private: boolean | null;
    hide_room_from_public_list: boolean | null;
  }>(
    `
    select
      gm.player_id,
      gm.role,
      gm.joined_at,
      coalesce(p.name, gm.player_id) as name,
      p.avatar_url,
      p.avatar,
      p.last_event_at,
      rp.room_id,
      r.is_private,
      pp.hide_room_from_public_list
    from public.group_members gm
    join public.players p on p.id = gm.player_id
    left join public.room_players rp
      on rp.player_id = p.id
      and rp.left_at is null
    left join public.rooms r
      on r.id = rp.room_id
    left join public.player_privacy pp
      on pp.player_id = p.id
    where gm.group_id = $1
    order by gm.joined_at asc
    `,
    [groupId],
  );

  const now = Date.now();
  return (rows ?? []).map((row) => {
    const lastEventTs = row.last_event_at ? Date.parse(row.last_event_at) : null;
    const isOnline = lastEventTs !== null && now - lastEventTs <= CONNECTED_TTL_MS;
    const roomHidden = row.is_private || row.hide_room_from_public_list === true;

    return {
      playerId: row.player_id,
      name: row.name ?? row.player_id,
      avatarUrl: row.avatar_url ?? null,
      avatar: row.avatar ?? null,
      lastEventAt: row.last_event_at ?? null,
      roomId: row.room_id && !roomHidden ? row.room_id : null,
      isOnline,
      role: row.role,
      joinedAt: row.joined_at,
    };
  });
}

export async function getGroupMessages(
  groupId: number,
  playerId: string,
  limit: number = 50,
): Promise<
  Array<{
    id: number;
    senderId: string;
    senderName: string;
    senderAvatarUrl: string | null;
    body: string;
    createdAt: string;
    readAt: string | null;
  }>
> {
  const { rows } = await query<{
    id: number;
    senderId: string;
    senderName: string;
    senderAvatarUrl: string | null;
    body: string;
    createdAt: string;
    readAt: string | null;
  }>(
    `
    select
      gmsg.id,
      gmsg.sender_id as "senderId",
      coalesce(p.name, gmsg.sender_id) as "senderName",
      p.avatar_url as "senderAvatarUrl",
      gmsg.body,
      gmsg.created_at as "createdAt",
      case
        -- Message incoming (des autres) : readAt basé sur MON last_read_message_id
        when gmsg.sender_id != $2 then
          case
            when gm.last_read_message_id is not null and gmsg.id <= gm.last_read_message_id
            then gmsg.created_at
            else null
          end
        -- Message outgoing (le mien) : readAt basé sur le last_read_message_id des AUTRES membres
        else
          case
            when exists (
              select 1
              from public.group_members gm2
              where gm2.group_id = $1
                and gm2.player_id != $2
                and gm2.last_read_message_id is not null
                and gm2.last_read_message_id >= gmsg.id
            )
            then gmsg.created_at
            else null
          end
      end as "readAt"
    from public.group_messages gmsg
    left join public.players p on p.id = gmsg.sender_id
    left join public.group_members gm on gm.group_id = $1 and gm.player_id = $2
    where gmsg.group_id = $1
    order by gmsg.id desc
    limit $3
    `,
    [groupId, playerId, limit],
  );

  return (rows ?? []).reverse();
}

export async function pushGroupEvent(
  groupId: number,
  type: string,
  payload: Record<string, any>,
  extraMemberIds: string[] = [],
  excludeMemberIds: string[] = [],
): Promise<void> {
  const memberIds = await getGroupMemberIds(groupId);
  const ids = new Set<string>([...memberIds, ...extraMemberIds]);
  const excludeSet = new Set(excludeMemberIds);
  for (const id of ids) {
    if (!excludeSet.has(id)) {
      pushUnifiedEvent(id, type, payload);
    }
  }
}

export async function recordGroupActivity({
  groupId,
  groupName,
  type,
  actorId,
  memberId,
  meta,
  createdAt,
}: {
  groupId: number;
  groupName: string;
  type:
    | "group_created"
    | "group_deleted"
    | "group_member_added"
    | "group_member_removed"
    | "group_renamed"
    | "group_member_joined"
    | "group_role_changed";
  actorId?: string | null;
  memberId?: string | null;
  meta?: Record<string, any> | null;
  createdAt?: string;
}): Promise<void> {
  const now = createdAt ?? new Date().toISOString();
  await query(
    `
    insert into public.group_activity (
      group_id,
      group_name,
      type,
      actor_id,
      member_id,
      meta,
      created_at
    )
    values ($1,$2,$3,$4,$5,$6,$7)
    `,
    [
      groupId,
      groupName,
      type,
      actorId ?? null,
      memberId ?? null,
      meta ?? null,
      now,
    ],
  );
}
