import type { Application, Request, Response } from "express";
import { query } from "../../db";
import { getIp } from "../../lib/ip";
import { checkRateLimit } from "../../lib/rateLimit";
import { parseSections } from "../../lib/utils";

type PlayerPrivacyPayload = {
  showGarden: boolean;
  showInventory: boolean;
  showCoins: boolean;
  showActivityLog: boolean;
  showJournal: boolean;
  showStats: boolean;
  hideRoomFromPublicList?: boolean;
};

const DEFAULT_PRIVACY: PlayerPrivacyPayload = {
  showGarden: true,
  showInventory: true,
  showCoins: true,
  showActivityLog: true,
  showJournal: true,
  showStats: true,
  hideRoomFromPublicList: false,
};

const SINGLE_ONLINE_THRESHOLD_MS = 6 * 60 * 1000;


export function registerPlayerViewRoute(app: Application): void {

  app.get("/get-player-view", async (req: Request, res: Response) => {
    const playerId = String(req.query.playerId ?? "").trim();
    const sectionsParam = req.query.sections;

    if (!playerId || playerId.length < 3) {
      return res.status(400).send("Invalid playerId");
    }

    const ip = getIp(req);
    try {
        const allowed = await checkRateLimit(ip, playerId, 300, 120);
        if (!allowed) {
        return res.status(429).send("Too many requests");
        }
    } catch (err) {
        console.error("get-player-view rate limit error:", err);
        return res.status(500).send("Rate limiter error");
    }

    const sectionsSet = parseSections(sectionsParam);

    const wantProfile = !sectionsSet || sectionsSet.has("profile");
    const wantGarden = !sectionsSet || sectionsSet.has("garden");
    const wantInventory = !sectionsSet || sectionsSet.has("inventory");
    const wantStats = !sectionsSet || sectionsSet.has("stats");
    const wantActivityLog =
      !sectionsSet || sectionsSet.has("activityLog");
    const wantJournal = !sectionsSet || sectionsSet.has("journal");
    const wantRoom = !sectionsSet || sectionsSet.has("room");
    const wantLeaderboard =
      !sectionsSet || sectionsSet.has("leaderboard");

    // 1) players
    let player: any = null;
    try {
      const { rows } = await query(
        `
        select
          id,
          name,
          avatar_url,
          avatar,
          coins,
          has_mod_installed,
          last_event_at,
          mod_version,
          badges
        from public.players
        where id = $1
        limit 1
        `,
        [playerId],
      );
      player = rows[0] ?? null;
    } catch (err) {
      console.error("get-player-view players error:", err);
      return res.status(500).send("DB error (players)");
    }

    if (!player) {
      return res.status(404).send("Player not found");
    }

    // 2) privacy
    let privacyRow: any = null;
    try {
      const { rows } = await query(
        `
        select
          show_garden,
          show_inventory,
          show_coins,
          show_activity_log,
          show_journal,
          show_stats,
          hide_room_from_public_list
        from public.player_privacy
        where player_id = $1
        limit 1
        `,
        [playerId],
      );
      privacyRow = rows[0] ?? null;
    } catch (err) {
      console.error("get-player-view privacy error:", err);
    }

    const rawPrivacy = privacyRow ?? {};

    const privacy: PlayerPrivacyPayload = {
      showGarden:
        typeof rawPrivacy.show_garden === "boolean"
          ? rawPrivacy.show_garden
          : DEFAULT_PRIVACY.showGarden,
      showInventory:
        typeof rawPrivacy.show_inventory === "boolean"
          ? rawPrivacy.show_inventory
          : DEFAULT_PRIVACY.showInventory,
      showCoins:
        typeof rawPrivacy.show_coins === "boolean"
          ? rawPrivacy.show_coins
          : DEFAULT_PRIVACY.showCoins,
      showActivityLog:
        typeof rawPrivacy.show_activity_log === "boolean"
          ? rawPrivacy.show_activity_log
          : DEFAULT_PRIVACY.showActivityLog,
      showJournal:
        typeof rawPrivacy.show_journal === "boolean"
          ? rawPrivacy.show_journal
          : DEFAULT_PRIVACY.showJournal,
      showStats:
        typeof rawPrivacy.show_stats === "boolean"
          ? rawPrivacy.show_stats
          : DEFAULT_PRIVACY.showStats,
      hideRoomFromPublicList:
        typeof rawPrivacy.hide_room_from_public_list === "boolean"
          ? rawPrivacy.hide_room_from_public_list
          : DEFAULT_PRIVACY.hideRoomFromPublicList,
    };

    // 3) player_state
    const needState =
      wantGarden ||
      wantInventory ||
      wantStats ||
      wantActivityLog ||
      wantJournal;

    let st: any = {};
    if (needState) {
      try {
        const { rows } = await query(
          `
          select garden, inventory, stats, activity_log, journal
          from public.player_state
          where player_id = $1
          limit 1
          `,
          [playerId],
        );
        st = rows[0] ?? {};
      } catch (err) {
        console.error("get-player-view player_state error:", err);
      }
    }

    // 4) room
    let room: any = null;
    if (wantRoom) {
      try {
        const { rows: rpRows } = await query(
          `
          select room_id
          from public.room_players
          where player_id = $1
            and left_at is null
          limit 1
          `,
          [playerId],
        );

        const rpRow = rpRows[0];
        if (rpRow?.room_id) {
          const { rows: roomRows } = await query(
            `
            select
              id,
              is_private,
              players_count,
              last_updated_at,
              last_updated_by_player_id,
              user_slots
            from public.rooms
            where id = $1
            limit 1
            `,
            [rpRow.room_id],
          );
          const roomData = roomRows[0] ?? null;
          // Don't show room if it's private or player hides it
          room = roomData && (roomData.is_private || privacy.hideRoomFromPublicList) ? null : roomData;
        }
      } catch (err) {
        console.error("get-player-view room error:", err);
      }
    }

    // 4b) leaderboard ranks
    let coinsRank: { rank: number; total: number; rankChange: number | null } | null = null;
    let eggsRank: { rank: number; total: number; rankChange: number | null } | null = null;
    if (wantLeaderboard && (privacy.showCoins || privacy.showStats)) {
      try {
        if (privacy.showCoins) {
          const { rows } = await query(
            `
            with ranked as (
              select
                ls.player_id,
                ls.coins,
                ls.coins_rank_snapshot_24h,
                row_number() over (
                  order by ls.coins desc, p.created_at desc
                ) as rank
              from public.leaderboard_stats ls
              join public.players p on p.id = ls.player_id
            )
            select rank, coins, coins_rank_snapshot_24h
            from ranked
            where player_id = $1
            limit 1
            `,
            [playerId],
          );
          const row = rows[0];
          if (row) {
            const currentRank = Number(row.rank ?? 0);
            const rankChange = row.coins_rank_snapshot_24h != null
              ? row.coins_rank_snapshot_24h - currentRank
              : null;
            coinsRank = {
              rank: currentRank,
              total: Number(row.coins ?? 0),
              rankChange,
            };
          }
        }
        if (privacy.showStats) {
          const { rows } = await query(
            `
            with ranked as (
              select
                ls.player_id,
                ls.eggs_hatched,
                ls.eggs_rank_snapshot_24h,
                row_number() over (
                  order by ls.eggs_hatched desc, p.created_at desc
                ) as rank
              from public.leaderboard_stats ls
              join public.players p on p.id = ls.player_id
            )
            select rank, eggs_hatched, eggs_rank_snapshot_24h
            from ranked
            where player_id = $1
            limit 1
            `,
            [playerId],
          );
          const row = rows[0];
          if (row) {
            const currentRank = Number(row.rank ?? 0);
            const rankChange = row.eggs_rank_snapshot_24h != null
              ? row.eggs_rank_snapshot_24h - currentRank
              : null;
            eggsRank = {
              rank: currentRank,
              total: Number(row.eggs_hatched ?? 0),
              rankChange,
            };
          }
        }
      } catch (err) {
        console.error("get-player-view leaderboard error:", err);
      }
    }

    // 5) online status
    const lastEventAt: string | null = player.last_event_at ?? null;
    let isOnline = false;

    if (lastEventAt) {
      const lastMs = new Date(lastEventAt).getTime();
      if (Number.isFinite(lastMs)) {
        const diff = Date.now() - lastMs;
        if (diff <= SINGLE_ONLINE_THRESHOLD_MS) {
          isOnline = true;
        }
      }
    }

    const responseBody = {
      playerId: player.id,
      playerName: wantProfile ? player.name : null,
      avatarUrl: wantProfile ? player.avatar_url : null,
      avatar: wantProfile ? player.avatar ?? null : null,
      coins:
        wantProfile && privacy.showCoins ? player.coins : null,
      room: wantRoom ? room : null,
      hasModInstalled: wantProfile ? !!player.has_mod_installed : false,
      modVersion: wantProfile ? player.mod_version ?? null : null,
      badges: wantProfile ? (player.badges ?? []) : [],
      isOnline,
      lastEventAt,
      privacy: wantProfile ? privacy : DEFAULT_PRIVACY,
      leaderboard: wantLeaderboard
        ? {
            coins: privacy.showCoins ? coinsRank : null,
            eggsHatched: privacy.showStats ? eggsRank : null,
          }
        : null,
      state: {
        garden:
          wantGarden && privacy.showGarden ? st.garden ?? null : null,
        inventory:
          wantInventory && privacy.showInventory
            ? st.inventory ?? null
            : null,
        stats:
          wantStats && privacy.showStats ? st.stats ?? null : null,
        activityLog:
          wantActivityLog && privacy.showActivityLog
            ? st.activity_log ?? null
            : null,
        journal:
          wantJournal && privacy.showJournal
            ? st.journal ?? null
            : null,
      },
    };

    return res.status(200).json(responseBody);
  });
}
