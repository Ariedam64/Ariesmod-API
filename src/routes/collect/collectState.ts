import type { Application, Request, Response } from "express";
import { query } from "../../db";
import { getIp } from "../../lib/ip";
import { checkRateLimit } from "../../lib/rateLimit";
import { recordPlayerOnline } from "../events/presence";
import { requireApiKey } from "../../middleware/auth";

export function registerCollectStateRoute(app: Application): void {
  app.post("/collect-state", requireApiKey, async (req: Request, res: Response) => {
    const ip = getIp(req);

    const body: any = req.body ?? {};
    const {
      playerName,
      avatar,
      coins,
      room,
      state,
      privacy,
      modVersion,
    } = body;

    // Extract playerId from authenticated token
    const pid = req.authenticatedPlayerId!;

    // ⬇⬇⬇ FIX: si "p_" = pas connecté => on ignore complètement
    if (pid.startsWith("p_")) {
      return res.status(204).send();
    }

    // Rate limit (sur l'id normalisé)
    try {
      const allowed = await checkRateLimit(ip, pid, 60, 60);
      if (!allowed) {
        return res.status(429).send("Too many requests");
      }
    } catch (err) {
      console.error("rate limit error:", err);
      return res.status(500).send("Rate limiter error");
    }

    const now = new Date().toISOString();
    const coinsValue = typeof coins === "number" ? coins : 0;
    const presenceRoomId =
      room && typeof room.id === "string" ? room.id : null;
    const normalizedPrivacy =
      privacy && typeof privacy === "object" ? privacy : null;
    const modVersionValue =
      typeof modVersion === "string"
        ? modVersion.trim().slice(0, 64) || null
        : null;
    let avatarValue: string[] | null = null;
    if (
      Array.isArray(avatar) &&
      avatar.length === 4 &&
      avatar.every(
        (entry) =>
          typeof entry === "string" && entry.trim().length > 0,
      )
    ) {
      avatarValue = avatar.map((entry) =>
        entry.trim().slice(0, 128),
      );
    }
    const avatarJson =
      avatarValue && avatarValue.length === 4
        ? JSON.stringify(avatarValue)
        : null;

    // 1) players : joueur local
    try {
      await query(
        `
        insert into public.players (
          id, name, avatar, coins, last_event_at, has_mod_installed, mod_version
        )
        values ($1,$2,$3::jsonb,$4,$5,true,$6)
        on conflict (id) do update set
          name = excluded.name,
          avatar = coalesce(excluded.avatar, public.players.avatar),
          coins = excluded.coins,
          last_event_at = excluded.last_event_at,
          has_mod_installed = true,
          mod_version = coalesce(
            excluded.mod_version,
            public.players.mod_version
          )
        `,
        [
          pid,
          typeof playerName === "string" && playerName.trim().length > 0
            ? playerName.trim()
            : pid,
          avatarJson,
          coinsValue,
          now,
          modVersionValue,
        ],
      );
    } catch (err) {
      console.error("players upsert error:", err);
      return res.status(500).send("DB error (players)");
    }

    // 1bis) player_privacy
    if (normalizedPrivacy) {
      const {
        showProfile,
        showGarden,
        showInventory,
        showCoins,
        showActivityLog,
        showJournal,
        showStats,
        hideRoomFromPublicList,
      } = normalizedPrivacy as any;

      try {
        await query(
          `
          insert into public.player_privacy (
            player_id,
            show_profile,
            show_garden,
            show_inventory,
            show_coins,
            show_activity_log,
            show_journal,
            show_stats,
            hide_room_from_public_list,
            updated_at
          )
          values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
          on conflict (player_id) do update set
            show_profile = excluded.show_profile,
            show_garden = excluded.show_garden,
            show_inventory = excluded.show_inventory,
            show_coins = excluded.show_coins,
            show_activity_log = excluded.show_activity_log,
            show_journal = excluded.show_journal,
            show_stats = excluded.show_stats,
            hide_room_from_public_list = excluded.hide_room_from_public_list,
            updated_at = excluded.updated_at
          `,
          [
            pid,
            typeof showProfile === "boolean" ? showProfile : null,
            typeof showGarden === "boolean" ? showGarden : null,
            typeof showInventory === "boolean" ? showInventory : null,
            typeof showCoins === "boolean" ? showCoins : null,
            typeof showActivityLog === "boolean" ? showActivityLog : null,
            typeof showJournal === "boolean" ? showJournal : null,
            typeof showStats === "boolean" ? showStats : null,
            typeof hideRoomFromPublicList === "boolean"
              ? hideRoomFromPublicList
              : null,
            now,
          ],
        );
      } catch (err) {
        console.error("player_privacy upsert error:", err);
        return res.status(500).send("DB error (player_privacy)");
      }
    }

    let eggsHatched: number | null = null;

    // 2) player_state (tout en JSON) – on ne touche à rien si state est null / pas un objet
    if (state && typeof state === "object") {
      const st: any = state;
      const garden = st.garden ?? null;
      const inventory = st.inventory ?? null;
      const stats = st.stats ?? null;
      const activityLog = st.activityLog ?? null;
      const journal = st.journal ?? null;

      const gardenJson =
        garden !== null && garden !== undefined ? JSON.stringify(garden) : null;
      const inventoryJson =
        inventory !== null && inventory !== undefined
          ? JSON.stringify(inventory)
          : null;
      const statsJson =
        stats !== null && stats !== undefined ? JSON.stringify(stats) : null;

      if (stats && typeof stats === "object") {
        const rawEggs = (stats as any)?.player?.numEggsHatched;
        if (typeof rawEggs === "number" && Number.isFinite(rawEggs)) {
          eggsHatched = Math.max(0, Math.floor(rawEggs));
        }
      }
      const activityLogJson =
        activityLog !== null && activityLog !== undefined
          ? JSON.stringify(activityLog)
          : null;
      const journalJson =
        journal !== null && journal !== undefined
          ? JSON.stringify(journal)
          : null;

      try {
        await query(
          `
          insert into public.player_state (
            player_id, garden, inventory, stats, activity_log, journal, updated_at
          )
          values ($1,$2,$3,$4,$5,$6,$7)
          on conflict (player_id) do update set
            garden = excluded.garden,
            inventory = excluded.inventory,
            stats = excluded.stats,
            activity_log = excluded.activity_log,
            journal = excluded.journal,
            updated_at = excluded.updated_at
          `,
          [
            pid,
            gardenJson,
            inventoryJson,
            statsJson,
            activityLogJson,
            journalJson,
            now,
          ],
        );
      } catch (err) {
        console.error("player_state upsert error:", err);
        return res.status(500).send("DB error (player_state)");
      }

    }

    // 3) rooms / room_players
    if (room && typeof room.id === "string") {
      const roomId: string = room.id;

      const hideRoom =
        normalizedPrivacy &&
        typeof normalizedPrivacy === "object" &&
        !!(normalizedPrivacy as any).hideRoomFromPublicList;

      const isPrivate = hideRoom || !!room.isPrivate;

      let playersCount: number | null = null;
      if (typeof room.playersCount === "number") {
        const n = Math.floor(room.playersCount);
        if (n >= 0 && n <= 6) {
          playersCount = n;
        }
      }

      let userSlots: any[] | null = null;
      const playersToUpsert: any[] = [];

      if (Array.isArray(room.userSlots)) {
        const cleaned: any[] = [];

        for (const slot of room.userSlots) {
          if (!slot || typeof slot !== "object") continue;
          const s: any = slot;

          const rawPlayerId =
            typeof s.playerId === "string" ? s.playerId.trim() : null;

          const name =
            typeof s.name === "string" ? s.name : rawPlayerId;

          let avatar_url: string | null = null;
          if (typeof s.avatarUrl === "string") {
            avatar_url = s.avatarUrl;
          } else if (typeof s.discordAvatarUrl === "string") {
            avatar_url = s.discordAvatarUrl;
          }

          const coinsCandidate = s.coins;
          const coinsNumber = Number(coinsCandidate);
          const coinsSlot =
            Number.isFinite(coinsNumber) ? coinsNumber : null;

          const cleanedSlot: any = {};
          if (name) cleanedSlot.name = name;
          if (avatar_url) cleanedSlot.avatar_url = avatar_url;
          if (rawPlayerId) cleanedSlot.player_id = rawPlayerId;
          if (coinsSlot !== null) cleanedSlot.coins = coinsSlot;

          if (Object.keys(cleanedSlot).length > 0) {
            cleaned.push(cleanedSlot);
          }

          // On n'upsert PAS les ids "p_" et pas le joueur local
          if (
            rawPlayerId &&
            rawPlayerId !== pid &&
            !rawPlayerId.startsWith("p_")
          ) {
            const row: any = {
              id: rawPlayerId,
              has_mod_installed: false,
              last_event_at: now,
            };
            if (name) row.name = name;
            if (avatar_url) row.avatar_url = avatar_url;
            if (coinsSlot !== null) row.coins = coinsSlot;
            playersToUpsert.push(row);
          }
        }

        if (cleaned.length > 0) {
          userSlots = cleaned;
        }
      }

      // bulk upsert autres joueurs (filtrés)
      if (playersToUpsert.length > 0) {
        const byId = new Map<string, any>();
        for (const p of playersToUpsert) {
          if (!p.id) continue;
          if (!byId.has(p.id)) {
            byId.set(p.id, p);
          }
        }
        const bulk = Array.from(byId.values());
        if (bulk.length > 0) {
          const values: string[] = [];
          const params: any[] = [];
          let idx = 1;
          for (const p of bulk) {
            values.push(
              `($${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++})`,
            );
            params.push(
              p.id,
              p.name ?? p.id,
              p.avatar_url ?? null,
              p.coins ?? 0,
              p.last_event_at,
            );
          }

          const sql = `
            insert into public.players (id, name, avatar_url, coins, last_event_at)
            values ${values.join(",")}
            on conflict (id) do update set
              name = excluded.name,
              avatar_url = excluded.avatar_url,
              coins = excluded.coins,
              last_event_at = excluded.last_event_at
          `;

          try {
            await query(sql, params);
          } catch (err) {
            console.error("players bulk upsert error:", err);
          }
        }
      }

      // JSON pour user_slots
      const userSlotsJson =
        userSlots && userSlots.length > 0 ? JSON.stringify(userSlots) : null;

      try {
        await query(
          `
          insert into public.rooms (
            id, is_private, last_updated_at, last_updated_by_player_id, players_count, user_slots
          )
          values ($1,$2,$3,$4,$5,$6)
          on conflict (id) do update set
            is_private = excluded.is_private,
            last_updated_at = excluded.last_updated_at,
            last_updated_by_player_id = excluded.last_updated_by_player_id,
            players_count = excluded.players_count,
            user_slots = excluded.user_slots
          `,
          [
            roomId,
            isPrivate,
            now,
            pid,
            playersCount,
            userSlotsJson,
          ],
        );
      } catch (err) {
        console.error("rooms upsert error:", err);
        return res.status(500).send("DB error (rooms)");
      }

      // close autres rooms
      try {
        await query(
          `
          update public.room_players
          set left_at = $1
          where player_id = $2
            and room_id <> $3
            and left_at is null
          `,
          [now, pid, roomId],
        );
      } catch (err) {
        console.error("room_players close others error:", err);
      }

      // upsert room_players actuelle
      try {
        await query(
          `
          insert into public.room_players (room_id, player_id, joined_at, left_at)
          values ($1,$2,$3,null)
          on conflict (room_id, player_id) do update set
            joined_at = excluded.joined_at,
            left_at = excluded.left_at
          `,
          [roomId, pid, now],
        );
      } catch (err) {
        console.error("room_players upsert error:", err);
        return res.status(500).send("DB error (room_players)");
      }
    }

    try {
      await recordPlayerOnline(pid, now, presenceRoomId);
    } catch (err) {
      console.error("presence update error:", err);
    }

    try {
      await query(
        `
        insert into public.leaderboard_stats (
          player_id, coins, eggs_hatched, updated_at
        )
        values ($1,$2,coalesce($3,0),$4)
        on conflict (player_id) do update set
          coins = excluded.coins,
          eggs_hatched = case
            when $3::bigint is null
              then public.leaderboard_stats.eggs_hatched
            else excluded.eggs_hatched
          end,
          updated_at = excluded.updated_at
        `,
        [pid, coinsValue, eggsHatched, now],
      );
    } catch (err) {
      console.error("leaderboard upsert error:", err);
    }

    return res.status(204).send();
  });
}
