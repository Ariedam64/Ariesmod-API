import { query } from "../../db";
import { CONNECTED_TTL_MS } from "../messages/common";

export type WelcomeData = {
  friends: Array<{
    playerId: string;
    name: string;
    avatarUrl: string | null;
    avatar: unknown;
    lastEventAt: string | null;
    roomId: string | null;
    isOnline: boolean;
  }>;
  friendRequests: {
    incoming: Array<{
      fromPlayerId: string;
      otherPlayerId: string;
      playerName: string;
      avatarUrl: string | null;
      createdAt: string;
    }>;
    outgoing: Array<{
      toPlayerId: string;
      otherPlayerId: string;
      playerName: string;
      avatarUrl: string | null;
      createdAt: string;
    }>;
  };
  groups: Array<{
    id: number;
    name: string;
    ownerId: string;
    role: string;
    memberCount: number;
    previewMembers: Array<{
      playerId: string;
      playerName: string;
      discordAvatarUrl: string | null;
    }>;
    unreadCount: number;
    createdAt: string;
    updatedAt: string;
  }>;
  conversations: Array<{
    conversationId: string;
    otherPlayerId: string;
    otherPlayerName: string;
    otherPlayerAvatarUrl: string | null;
    messages: Array<{
      id: number;
      senderId: string;
      recipientId: string;
      body: string;
      createdAt: string;
      readAt: string | null;
    }>;
    unreadCount: number;
  }>;
  modPlayers: Array<{
    playerId: string;
    playerName: string;
    avatarUrl: string | null;
    avatar: unknown;
    lastEventAt: string | null;
  }>;
};

async function getFriends(playerId: string): Promise<WelcomeData["friends"]> {
  const { rows } = await query<{
    id: string;
    name: string | null;
    avatar_url: string | null;
    avatar: unknown;
    last_event_at: string | null;
    room_id: string | null;
    is_private: boolean | null;
  }>(
    `
    select
      p.id,
      p.name,
      p.avatar_url,
      p.avatar,
      p.last_event_at,
      rp.room_id,
      r2.is_private
    from public.player_relationships r
    join public.players p
      on p.id = case
        when r.user_one_id = $1 then r.user_two_id
        else r.user_one_id
      end
    left join public.room_players rp
      on rp.player_id = p.id
      and rp.left_at is null
    left join public.rooms r2
      on r2.id = rp.room_id
    where r.status = 'accepted'
      and (r.user_one_id = $1 or r.user_two_id = $1)
    `,
    [playerId],
  );

  const now = Date.now();
  return (rows ?? []).map((row) => {
    const lastEventTs = row.last_event_at ? Date.parse(row.last_event_at) : null;
    const isOnline = lastEventTs !== null && now - lastEventTs <= CONNECTED_TTL_MS;

    return {
      playerId: row.id,
      name: row.name ?? row.id,
      avatarUrl: row.avatar_url ?? null,
      avatar: row.avatar ?? null,
      lastEventAt: row.last_event_at ?? null,
      roomId: row.room_id && !row.is_private ? row.room_id : null,
      isOnline,
    };
  });
}

async function getFriendRequests(
  playerId: string,
): Promise<WelcomeData["friendRequests"]> {
  type RelRow = {
    user_one_id: string;
    user_two_id: string;
    requested_by: string;
    status: string;
    created_at: string;
    other_player_name: string | null;
    other_player_avatar_url: string | null;
  };

  const result = await query<RelRow>(
    `
    select
      pr.user_one_id,
      pr.user_two_id,
      pr.requested_by,
      pr.status,
      pr.created_at,
      p.name as other_player_name,
      p.avatar_url as other_player_avatar_url
    from public.player_relationships pr
    join public.players p on p.id = case
      when pr.user_one_id = $1 then pr.user_two_id
      else pr.user_one_id
    end
    where pr.status = 'pending'
      and (pr.user_one_id = $1 or pr.user_two_id = $1)
    order by pr.created_at desc
    `,
    [playerId],
  );
  const rows = result.rows ?? [];

  const incoming: WelcomeData["friendRequests"]["incoming"] = [];
  const outgoing: WelcomeData["friendRequests"]["outgoing"] = [];

  for (const rel of rows) {
    const otherId =
      rel.user_one_id === playerId ? rel.user_two_id : rel.user_one_id;

    if (rel.requested_by === playerId) {
      outgoing.push({
        toPlayerId: otherId,
        otherPlayerId: otherId,
        playerName: rel.other_player_name ?? otherId,
        avatarUrl: rel.other_player_avatar_url ?? null,
        createdAt: rel.created_at,
      });
    } else {
      incoming.push({
        fromPlayerId: rel.requested_by,
        otherPlayerId: rel.requested_by,
        playerName: rel.other_player_name ?? rel.requested_by,
        avatarUrl: rel.other_player_avatar_url ?? null,
        createdAt: rel.created_at,
      });
    }
  }

  return { incoming, outgoing };
}

async function getGroups(playerId: string): Promise<WelcomeData["groups"]> {
  const { rows } = await query<{
    id: number;
    name: string;
    owner_id: string;
    created_at: string;
    updated_at: string;
    role: string;
    member_count: string;
    preview_members: any;
    unread_count: string;
  }>(
    `
    select
      g.id,
      g.name,
      g.owner_id,
      g.created_at,
      g.updated_at,
      gm.role,
      (
        select count(*)::text
        from public.group_members gm2
        where gm2.group_id = g.id
      ) as member_count,
      coalesce(pm.preview_members, '[]'::jsonb) as preview_members,
      (
        select count(*)::text
        from public.group_messages gmsg
        where gmsg.group_id = g.id
          and (gm.last_read_message_id is null or gmsg.id > gm.last_read_message_id)
      ) as unread_count
    from public.group_members gm
    join public.groups g on g.id = gm.group_id
    left join lateral (
      select jsonb_agg(
        jsonb_build_object(
          'playerId', p.id,
          'playerName', coalesce(p.name, p.id),
          'discordAvatarUrl', p.avatar_url
        )
        order by gmp.joined_at asc
      ) as preview_members
      from (
        select gm2.player_id, gm2.joined_at
        from public.group_members gm2
        where gm2.group_id = g.id
        order by gm2.joined_at asc
        limit 3
      ) gmp
      join public.players p on p.id = gmp.player_id
    ) pm on true
    where gm.player_id = $1
    order by g.updated_at desc
    `,
    [playerId],
  );

  return (rows ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    ownerId: row.owner_id,
    role: row.role,
    memberCount: Number(row.member_count ?? "0"),
    previewMembers: Array.isArray(row.preview_members)
      ? row.preview_members
      : [],
    unreadCount: Number(row.unread_count ?? "0"),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

async function getModPlayers(): Promise<WelcomeData["modPlayers"]> {
  const { rows } = await query<{
    id: string;
    name: string | null;
    avatar_url: string | null;
    avatar: unknown;
    last_event_at: string | null;
  }>(
    `
    select
      p.id,
      p.name,
      p.avatar_url,
      p.avatar,
      p.last_event_at
    from public.players p
    left join public.player_privacy pp
      on pp.player_id = p.id
    where p.has_mod_installed = true
      and (pp.show_profile is distinct from false)
    order by p.last_event_at desc nulls last, p.id asc
    limit 100
    `,
    [],
  );

  return (rows ?? []).map((row) => ({
    playerId: row.id,
    playerName: row.name ?? row.id,
    avatarUrl: row.avatar_url ?? null,
    avatar: row.avatar ?? null,
    lastEventAt: row.last_event_at ?? null,
  }));
}

async function getConversations(
  playerId: string,
): Promise<WelcomeData["conversations"]> {
  const { rows } = await query<{
    conversation_id: string;
    other_player_id: string;
    other_player_name: string | null;
    other_player_avatar_url: string | null;
    messages: any;
    unread_count: string;
  }>(
    `
    with friend_conversations as (
      select distinct
        dm.conversation_id,
        case
          when dm.sender_id = $1 then dm.recipient_id
          else dm.sender_id
        end as other_player_id
      from public.direct_messages dm
      where dm.sender_id = $1 or dm.recipient_id = $1
    ),
    conversation_messages as (
      select
        fc.conversation_id,
        dm.id,
        dm.sender_id,
        dm.recipient_id,
        dm.body,
        dm.created_at,
        dm.read_at,
        row_number() over (partition by fc.conversation_id order by dm.id desc) as rn
      from friend_conversations fc
      join public.direct_messages dm on dm.conversation_id = fc.conversation_id
    ),
    recent_messages as (
      select
        conversation_id,
        jsonb_agg(
          jsonb_build_object(
            'id', id,
            'senderId', sender_id,
            'recipientId', recipient_id,
            'body', body,
            'createdAt', created_at,
            'readAt', read_at
          )
          order by id desc
        ) as messages,
        max(created_at) as last_message_created_at
      from conversation_messages
      where rn <= 500
      group by conversation_id
    ),
    unread_counts as (
      select
        conversation_id,
        count(*)::text as unread_count
      from public.direct_messages
      where recipient_id = $1
        and read_at is null
      group by conversation_id
    )
    select
      fc.conversation_id,
      fc.other_player_id,
      coalesce(p.name, fc.other_player_id) as other_player_name,
      p.avatar_url as other_player_avatar_url,
      rm.messages,
      coalesce(uc.unread_count, '0') as unread_count
    from friend_conversations fc
    left join recent_messages rm on rm.conversation_id = fc.conversation_id
    left join unread_counts uc on uc.conversation_id = fc.conversation_id
    left join public.players p on p.id = fc.other_player_id
    where rm.messages is not null
    order by rm.last_message_created_at desc
    limit 50
    `,
    [playerId],
  );

  return (rows ?? []).map((row) => ({
    conversationId: row.conversation_id,
    otherPlayerId: row.other_player_id,
    otherPlayerName: row.other_player_name ?? row.other_player_id,
    otherPlayerAvatarUrl: row.other_player_avatar_url,
    messages: Array.isArray(row.messages) ? row.messages : [],
    unreadCount: Number(row.unread_count ?? "0"),
  }));
}

export async function buildWelcomeData(
  playerId: string,
): Promise<WelcomeData> {
  const [friends, friendRequests, groups, conversations, modPlayers] =
    await Promise.all([
      getFriends(playerId),
      getFriendRequests(playerId),
      getGroups(playerId),
      getConversations(playerId),
      getModPlayers(),
    ]);

  return {
    friends,
    friendRequests,
    groups,
    conversations,
    modPlayers,
  };
}
