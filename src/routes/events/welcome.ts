import { query } from "../../db";
import { CONNECTED_TTL_MS } from "../messages/common";

export type WelcomeData = {
  myProfile: {
    playerId: string;
    name: string;
    avatarUrl: string | null;
    avatar: unknown;
    privacy: {
      showGarden: boolean;
      showInventory: boolean;
      showCoins: boolean;
      showActivityLog: boolean;
      showJournal: boolean;
      showStats: boolean;
      hideRoomFromPublicList: boolean;
    };
  };
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
    isPublic: boolean;
    role: string;
    memberCount: number;
    previewMembers: Array<{
      playerId: string;
      playerName: string;
      discordAvatarUrl: string | null;
      avatar: unknown;
    }>;
    unreadCount: number;
    createdAt: string;
    updatedAt: string;
  }>;
  conversations: {
    friends: Array<{
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
    groups: Array<{
      groupId: number;
      groupName: string;
      messages: Array<{
        id: number;
        senderId: string;
        senderName: string;
        senderAvatarUrl: string | null;
        body: string;
        createdAt: string;
        readAt: string | null;
      }>;
      unreadCount: number;
    }>;
  };
  publicGroups: Array<{
    id: number;
    name: string;
    ownerId: string;
    memberCount: number;
    previewMembers: Array<{
      playerId: string;
      playerName: string;
      discordAvatarUrl: string | null;
      avatar: unknown;
    }>;
    createdAt: string;
    updatedAt: string;
  }>;
  modPlayers: Array<{
    playerId: string;
    playerName: string;
    avatarUrl: string | null;
    avatar: unknown;
    lastEventAt: string | null;
    isOnline: boolean;
  }>;
  publicRooms: Array<{
    id: string;
    playersCount: number;
    userSlots: unknown;
    lastUpdatedAt: string | null;
  }>;
  groupMembers: Array<{
    playerId: string;
    name: string;
    avatarUrl: string | null;
    avatar: unknown;
    lastEventAt: string | null;
    roomId: string | null;
    isOnline: boolean;
    groupIds: number[];
  }>;
  leaderboard: {
    coins: {
      top: Array<{
        playerId: string;
        playerName: string;
        avatarUrl: string | null;
        avatar: unknown;
        rank: number;
        total: number;
        rankChange: number | null;
      }>;
      myRank: {
        playerId: string;
        playerName: string;
        avatarUrl: string | null;
        avatar: unknown;
        rank: number;
        total: number;
        rankChange: number | null;
      } | null;
    };
    eggsHatched: {
      top: Array<{
        playerId: string;
        playerName: string;
        avatarUrl: string | null;
        avatar: unknown;
        rank: number;
        total: number;
        rankChange: number | null;
      }>;
      myRank: {
        playerId: string;
        playerName: string;
        avatarUrl: string | null;
        avatar: unknown;
        rank: number;
        total: number;
        rankChange: number | null;
      } | null;
    };
  };
};

async function getMyProfile(playerId: string): Promise<WelcomeData["myProfile"]> {
  const { rows } = await query<{
    id: string;
    name: string | null;
    avatar_url: string | null;
    avatar: unknown;
    show_garden: boolean | null;
    show_inventory: boolean | null;
    show_coins: boolean | null;
    show_activity_log: boolean | null;
    show_journal: boolean | null;
    show_stats: boolean | null;
    hide_room_from_public_list: boolean | null;
  }>(
    `
    select
      p.id,
      p.name,
      p.avatar_url,
      p.avatar,
      pp.show_garden,
      pp.show_inventory,
      pp.show_coins,
      pp.show_activity_log,
      pp.show_journal,
      pp.show_stats,
      pp.hide_room_from_public_list
    from public.players p
    left join public.player_privacy pp
      on pp.player_id = p.id
    where p.id = $1
    `,
    [playerId],
  );

  const row = rows?.[0];
  return {
    playerId,
    name: row?.name ?? playerId,
    avatarUrl: row?.avatar_url ?? null,
    avatar: row?.avatar ?? null,
    privacy: {
      showGarden: row?.show_garden !== false,
      showInventory: row?.show_inventory !== false,
      showCoins: row?.show_coins !== false,
      showActivityLog: row?.show_activity_log !== false,
      showJournal: row?.show_journal !== false,
      showStats: row?.show_stats !== false,
      hideRoomFromPublicList: row?.hide_room_from_public_list === true,
    },
  };
}

async function getFriends(playerId: string): Promise<WelcomeData["friends"]> {
  const { rows } = await query<{
    id: string;
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
      p.id,
      p.name,
      p.avatar_url,
      p.avatar,
      p.last_event_at,
      rp.room_id,
      r2.is_private,
      pp.hide_room_from_public_list
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
    left join public.player_privacy pp
      on pp.player_id = p.id
    where r.status = 'accepted'
      and (r.user_one_id = $1 or r.user_two_id = $1)
    `,
    [playerId],
  );

  const now = Date.now();
  return (rows ?? []).map((row) => {
    const lastEventTs = row.last_event_at ? Date.parse(row.last_event_at) : null;
    const isOnline = lastEventTs !== null && now - lastEventTs <= CONNECTED_TTL_MS;
    const roomHidden = row.is_private || row.hide_room_from_public_list === true;

    return {
      playerId: row.id,
      name: row.name ?? row.id,
      avatarUrl: row.avatar_url ?? null,
      avatar: row.avatar ?? null,
      lastEventAt: row.last_event_at ?? null,
      roomId: row.room_id && !roomHidden ? row.room_id : null,
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
    is_public: boolean;
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
      g.is_public,
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
          and gmsg.sender_id != $1
      ) as unread_count
    from public.group_members gm
    join public.groups g on g.id = gm.group_id
    left join lateral (
      select jsonb_agg(
        jsonb_build_object(
          'playerId', p.id,
          'playerName', coalesce(p.name, p.id),
          'discordAvatarUrl', p.avatar_url,
          'avatar', p.avatar
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
    isPublic: row.is_public,
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

async function getPublicGroups(playerId: string): Promise<WelcomeData["publicGroups"]> {
  const { rows } = await query<{
    id: number;
    name: string;
    owner_id: string;
    created_at: string;
    updated_at: string;
    member_count: string;
    preview_members: any;
  }>(
    `
    select
      g.id,
      g.name,
      g.owner_id,
      g.created_at,
      g.updated_at,
      (
        select count(*)::text
        from public.group_members gm2
        where gm2.group_id = g.id
      ) as member_count,
      coalesce(pm.preview_members, '[]'::jsonb) as preview_members
    from public.groups g
    left join lateral (
      select jsonb_agg(
        jsonb_build_object(
          'playerId', p.id,
          'playerName', coalesce(p.name, p.id),
          'discordAvatarUrl', p.avatar_url,
          'avatar', p.avatar
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
    where g.is_public = true
      and not exists (
        select 1
        from public.group_members gm
        where gm.group_id = g.id
          and gm.player_id = $1
      )
    order by g.updated_at desc
    limit 50
    `,
    [playerId],
  );

  return (rows ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    ownerId: row.owner_id,
    memberCount: Number(row.member_count ?? "0"),
    previewMembers: Array.isArray(row.preview_members)
      ? row.preview_members
      : [],
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
      id,
      name,
      avatar_url,
      avatar,
      last_event_at
    from public.players
    where has_mod_installed = true
    order by last_event_at desc nulls last, id asc
    limit 100
    `,
    [],
  );

  const now = Date.now();
  return (rows ?? []).map((row) => {
    const lastEventTs = row.last_event_at ? Date.parse(row.last_event_at) : null;
    const isOnline = lastEventTs !== null && now - lastEventTs <= CONNECTED_TTL_MS;

    return {
      playerId: row.id,
      playerName: row.name ?? row.id,
      avatarUrl: row.avatar_url ?? null,
      avatar: row.avatar ?? null,
      lastEventAt: row.last_event_at ?? null,
      isOnline,
    };
  });
}

async function getConversations(
  playerId: string,
): Promise<WelcomeData["conversations"]["friends"]> {
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

async function getGroupConversations(
  playerId: string,
): Promise<WelcomeData["conversations"]["groups"]> {
  const { rows } = await query<{
    group_id: number;
    group_name: string;
    unread_count: string;
    messages: any;
  }>(
    `
    select
      g.id as group_id,
      g.name as group_name,
      (
        select count(*)::text
        from public.group_messages gmsg
        where gmsg.group_id = g.id
          and (gm.last_read_message_id is null or gmsg.id > gm.last_read_message_id)
          and gmsg.sender_id != $1
      ) as unread_count,
      coalesce(
        (
          select jsonb_agg(sub order by sub.id asc)
          from (
            select
              gmsg.id,
              gmsg.sender_id as "senderId",
              coalesce(p_sender.name, gmsg.sender_id) as "senderName",
              p_sender.avatar_url as "senderAvatarUrl",
              gmsg.body,
              gmsg.created_at as "createdAt",
              case
                -- Message incoming (des autres) : readAt basé sur MON last_read_message_id
                when gmsg.sender_id != $1 then
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
                      where gm2.group_id = g.id
                        and gm2.player_id != $1
                        and gm2.last_read_message_id is not null
                        and gm2.last_read_message_id >= gmsg.id
                    )
                    then gmsg.created_at
                    else null
                  end
              end as "readAt"
            from public.group_messages gmsg
            left join public.players p_sender on p_sender.id = gmsg.sender_id
            where gmsg.group_id = g.id
            order by gmsg.id desc
            limit 50
          ) sub
        ),
        '[]'::jsonb
      ) as messages
    from public.group_members gm
    join public.groups g on g.id = gm.group_id
    where gm.player_id = $1
    `,
    [playerId],
  );

  return (rows ?? [])
    .map((row) => ({
      groupId: row.group_id,
      groupName: row.group_name,
      messages: Array.isArray(row.messages) ? row.messages : [],
      unreadCount: Number(row.unread_count ?? "0"),
    }))
    .filter((conv) => conv.messages.length > 0); // Only include groups with messages
}

async function getGroupMembers(playerId: string): Promise<WelcomeData["groupMembers"]> {
  const { rows } = await query<{
    member_id: string;
    member_name: string | null;
    avatar_url: string | null;
    avatar: unknown;
    last_event_at: string | null;
    room_id: string | null;
    is_private: boolean | null;
    hide_room_from_public_list: boolean | null;
    group_ids: string;
  }>(
    `
    select
      gm.player_id as member_id,
      p.name as member_name,
      p.avatar_url,
      p.avatar,
      p.last_event_at,
      rp.room_id,
      r.is_private,
      pp.hide_room_from_public_list,
      string_agg(gm.group_id::text, ',') as group_ids
    from public.group_members gm
    join public.players p
      on p.id = gm.player_id
    left join public.room_players rp
      on rp.player_id = p.id
      and rp.left_at is null
    left join public.rooms r
      on r.id = rp.room_id
    left join public.player_privacy pp
      on pp.player_id = p.id
    where gm.group_id in (
      select group_id
      from public.group_members
      where player_id = $1
    )
      and gm.player_id != $1
    group by gm.player_id, p.name, p.avatar_url, p.avatar, p.last_event_at, rp.room_id, r.is_private, pp.hide_room_from_public_list
    `,
    [playerId],
  );

  const now = Date.now();
  return (rows ?? []).map((row) => {
    const lastEventTs = row.last_event_at ? Date.parse(row.last_event_at) : null;
    const isOnline = lastEventTs !== null && now - lastEventTs <= CONNECTED_TTL_MS;
    const roomHidden = row.is_private || row.hide_room_from_public_list === true;
    const groupIds = row.group_ids ? row.group_ids.split(',').map(Number) : [];

    return {
      playerId: row.member_id,
      name: row.member_name ?? row.member_id,
      avatarUrl: row.avatar_url ?? null,
      avatar: row.avatar ?? null,
      lastEventAt: row.last_event_at ?? null,
      roomId: row.room_id && !roomHidden ? row.room_id : null,
      isOnline,
      groupIds,
    };
  });
}

const ROOM_TTL_MS = 6 * 60 * 1000;

async function getPublicRooms(): Promise<WelcomeData["publicRooms"]> {
  const cutoff = new Date(Date.now() - ROOM_TTL_MS).toISOString();

  const { rows } = await query<{
    id: string;
    players_count: number;
    user_slots: unknown;
    last_updated_at: string | null;
  }>(
    `
    select
      id,
      players_count,
      user_slots,
      last_updated_at
    from public.rooms
    where is_private = false
      and last_updated_at >= $1
    order by players_count desc
    `,
    [cutoff],
  );

  return (rows ?? []).map((row) => ({
    id: row.id,
    playersCount: row.players_count,
    userSlots: row.user_slots ?? null,
    lastUpdatedAt: row.last_updated_at ?? null,
  }));
}

async function getLeaderboard(playerId: string): Promise<WelcomeData["leaderboard"]> {
  type CoinsRow = {
    player_id: string;
    name: string | null;
    avatar_url: string | null;
    avatar: unknown;
    coins: string | number;
    show_coins: boolean | null;
    rank: string | number;
    coins_rank_snapshot_24h: number | null;
  };

  type EggsRow = {
    player_id: string;
    name: string | null;
    avatar_url: string | null;
    avatar: unknown;
    eggs_hatched: string | number;
    show_stats: boolean | null;
    rank: string | number;
    eggs_rank_snapshot_24h: number | null;
  };

  // Get top 15 for coins
  const { rows: coinsTop } = await query<CoinsRow>(
    `
    select
      ls.player_id,
      p.name,
      p.avatar_url,
      p.avatar,
      ls.coins,
      pr.show_coins,
      ls.coins_rank_snapshot_24h,
      row_number() over (order by ls.coins desc, p.created_at desc) as rank
    from public.leaderboard_stats ls
    join public.players p on p.id = ls.player_id
    left join public.player_privacy pr on pr.player_id = p.id
    order by ls.coins desc, p.created_at desc
    limit 15
    `,
    [],
  );

  // Get my rank for coins
  const { rows: coinsMyRank } = await query<CoinsRow>(
    `
    with ranked as (
      select
        ls.player_id,
        p.name,
        p.avatar_url,
        p.avatar,
        ls.coins,
        pr.show_coins,
        ls.coins_rank_snapshot_24h,
        row_number() over (order by ls.coins desc, p.created_at desc) as rank
      from public.leaderboard_stats ls
      join public.players p on p.id = ls.player_id
      left join public.player_privacy pr on pr.player_id = p.id
    )
    select * from ranked
    where player_id = $1
    limit 1
    `,
    [playerId],
  );

  // Get top 15 for eggs hatched
  const { rows: eggsTop } = await query<EggsRow>(
    `
    select
      ls.player_id,
      p.name,
      p.avatar_url,
      p.avatar,
      ls.eggs_hatched,
      pr.show_stats,
      ls.eggs_rank_snapshot_24h,
      row_number() over (order by ls.eggs_hatched desc, p.created_at desc) as rank
    from public.leaderboard_stats ls
    join public.players p on p.id = ls.player_id
    left join public.player_privacy pr on pr.player_id = p.id
    order by ls.eggs_hatched desc, p.created_at desc
    limit 15
    `,
    [],
  );

  // Get my rank for eggs hatched
  const { rows: eggsMyRank } = await query<EggsRow>(
    `
    with ranked as (
      select
        ls.player_id,
        p.name,
        p.avatar_url,
        p.avatar,
        ls.eggs_hatched,
        pr.show_stats,
        ls.eggs_rank_snapshot_24h,
        row_number() over (order by ls.eggs_hatched desc, p.created_at desc) as rank
      from public.leaderboard_stats ls
      join public.players p on p.id = ls.player_id
      left join public.player_privacy pr on pr.player_id = p.id
    )
    select * from ranked
    where player_id = $1
    limit 1
    `,
    [playerId],
  );

  function coinsRankChange(row: CoinsRow): number | null {
    const current = Number(row.rank ?? 0);
    return row.coins_rank_snapshot_24h != null ? row.coins_rank_snapshot_24h - current : null;
  }

  function eggsRankChange(row: EggsRow): number | null {
    const current = Number(row.rank ?? 0);
    return row.eggs_rank_snapshot_24h != null ? row.eggs_rank_snapshot_24h - current : null;
  }

  return {
    coins: {
      top: (coinsTop ?? []).map((row) => {
        const anonymized = row.show_coins === false;
        return {
          playerId: anonymized ? "null" : row.player_id,
          playerName: anonymized ? "anonymous" : (row.name ?? row.player_id),
          avatarUrl: anonymized ? null : (row.avatar_url ?? null),
          avatar: anonymized ? null : (row.avatar ?? null),
          rank: Number(row.rank ?? 0),
          total: Number(row.coins ?? 0),
          rankChange: coinsRankChange(row),
        };
      }),
      myRank: coinsMyRank[0] ? {
        playerId: coinsMyRank[0].player_id,
        playerName: coinsMyRank[0].name ?? coinsMyRank[0].player_id,
        avatarUrl: coinsMyRank[0].avatar_url ?? null,
        avatar: coinsMyRank[0].avatar ?? null,
        rank: Number(coinsMyRank[0].rank ?? 0),
        total: Number(coinsMyRank[0].coins ?? 0),
        rankChange: coinsRankChange(coinsMyRank[0]),
      } : null,
    },
    eggsHatched: {
      top: (eggsTop ?? []).map((row) => {
        const anonymized = row.show_stats === false;
        return {
          playerId: anonymized ? "null" : row.player_id,
          playerName: anonymized ? "anonymous" : (row.name ?? row.player_id),
          avatarUrl: anonymized ? null : (row.avatar_url ?? null),
          avatar: anonymized ? null : (row.avatar ?? null),
          rank: Number(row.rank ?? 0),
          total: Number(row.eggs_hatched ?? 0),
          rankChange: eggsRankChange(row),
        };
      }),
      myRank: eggsMyRank[0] ? {
        playerId: eggsMyRank[0].player_id,
        playerName: eggsMyRank[0].name ?? eggsMyRank[0].player_id,
        avatarUrl: eggsMyRank[0].avatar_url ?? null,
        avatar: eggsMyRank[0].avatar ?? null,
        rank: Number(eggsMyRank[0].rank ?? 0),
        total: Number(eggsMyRank[0].eggs_hatched ?? 0),
        rankChange: eggsRankChange(eggsMyRank[0]),
      } : null,
    },
  };
}

export async function buildWelcomeData(
  playerId: string,
): Promise<WelcomeData> {
  const [myProfile, friends, friendRequests, groups, publicGroups, friendConversations, groupConversations, modPlayers, publicRooms, groupMembers, leaderboard] =
    await Promise.all([
      getMyProfile(playerId),
      getFriends(playerId),
      getFriendRequests(playerId),
      getGroups(playerId),
      getPublicGroups(playerId),
      getConversations(playerId),
      getGroupConversations(playerId),
      getModPlayers(),
      getPublicRooms(),
      getGroupMembers(playerId),
      getLeaderboard(playerId),
    ]);

  return {
    myProfile,
    friends,
    friendRequests,
    groups,
    publicGroups,
    conversations: {
      friends: friendConversations,
      groups: groupConversations,
    },
    modPlayers,
    publicRooms,
    groupMembers,
    leaderboard,
  };
}
