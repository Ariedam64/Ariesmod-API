import { query } from "../../db";
import { pushUnifiedEvent } from "../events/hub";

export const GROUP_MAX_MEMBERS = 12;
export const GROUP_NAME_MAX = 40;

export type GroupAccess = {
  groupId: number;
  name: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  role: string | null;
};

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
    created_at: string;
    updated_at: string;
    role: string | null;
  }>(
    `
    select
      g.id,
      g.name,
      g.owner_id,
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

export async function getGroupMembersDetailed(
  groupId: number,
): Promise<
  Array<{
    playerId: string;
    name: string;
    avatarUrl: string | null;
    avatar: unknown;
    lastEventAt: string | null;
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
  }>(
    `
    select
      gm.player_id,
      gm.role,
      gm.joined_at,
      coalesce(p.name, gm.player_id) as name,
      p.avatar_url,
      p.avatar,
      p.last_event_at
    from public.group_members gm
    join public.players p on p.id = gm.player_id
    where gm.group_id = $1
    order by gm.joined_at asc
    `,
    [groupId],
  );

  return (rows ?? []).map((row) => ({
    playerId: row.player_id,
    name: row.name ?? row.player_id,
    avatarUrl: row.avatar_url ?? null,
    avatar: row.avatar ?? null,
    lastEventAt: row.last_event_at ?? null,
    role: row.role,
    joinedAt: row.joined_at,
  }));
}

export async function pushGroupEvent(
  groupId: number,
  type: string,
  payload: Record<string, any>,
  extraMemberIds: string[] = [],
): Promise<void> {
  const memberIds = await getGroupMemberIds(groupId);
  const ids = new Set<string>([...memberIds, ...extraMemberIds]);
  for (const id of ids) {
    pushUnifiedEvent(id, type, payload);
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
    | "group_renamed";
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
