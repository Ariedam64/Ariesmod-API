import type { Application, Request, Response } from "express";
import { query } from "../../db";
import { getIp } from "../../lib/ip";
import { checkRateLimit } from "../../lib/rateLimit";
import { parseSections } from "../../lib/utils";

type PlayerPrivacyPayload = {
  showProfile: boolean;
  showGarden: boolean;
  showInventory: boolean;
  showCoins: boolean;
  showActivityLog: boolean;
  showJournal: boolean;
  showStats: boolean;
  hideRoomFromPublicList?: boolean;
};

const DEFAULT_PRIVACY: PlayerPrivacyPayload = {
  showProfile: true,
  showGarden: true,
  showInventory: true,
  showCoins: true,
  showActivityLog: true,
  showJournal: true,
  showStats: true,
  hideRoomFromPublicList: false,
};  

const MULTI_ONLINE_THRESHOLD_MS = 6 * 60 * 1000;
  
export function registerPlayersViewRoute(app: Application): void {
  app.post(
    "/get-players-view",
    async (req: Request, res: Response) => {
      const ip = getIp(req);
      const body: any = req.body ?? {};
      const playerIdsRaw = body.playerIds;
      const sections = parseSections(body.sections);

      if (!Array.isArray(playerIdsRaw) || playerIdsRaw.length === 0) {
        return res
          .status(400)
          .send("playerIds must be a non-empty array");
      }

      const playerIds = Array.from(
        new Set(
          playerIdsRaw
            .map((x: any) => String(x ?? "").trim())
            .filter((x: string) => x.length >= 3),
        ),
      );

      if (playerIds.length === 0) {
        return res.status(400).send("No valid playerIds");
      }

      if (playerIds.length > 50) {
        return res
          .status(400)
          .send("Too many playerIds (max 50)");
      }

      // rate limit global sur IP
      try {
        const allowed = await checkRateLimit(ip, null);
        if (!allowed) {
          return res.status(429).send("Too many requests");
        }
      } catch (err) {
        console.error("get-players-view rate limit error:", err);
        return res.status(500).send("Rate limiter error");
      }

      const needProfile = !sections || sections.has("profile");
      const needRoom = !sections || sections.has("room");
      const needState =
        !sections ||
        sections.has("garden") ||
        sections.has("inventory") ||
        sections.has("stats") ||
        sections.has("activityLog") ||
        sections.has("journal");

      // 1) players
      let playerRows: any[] = [];
      try {
        const result = await query(
          `
          select
            id,
            name,
            avatar_url,
            coins,
            has_mod_installed,
            last_event_at
          from public.players
          where id = any($1::text[])
          `,
          [playerIds],
        );
        playerRows = result.rows ?? [];
      } catch (err) {
        console.error("get-players-view players error:", err);
        return res.status(500).send("DB error (players)");
      }

      // 2) privacy
      let privacyRows: any[] = [];
      try {
        const result = await query(
          `
          select
            player_id,
            show_profile,
            show_garden,
            show_inventory,
            show_coins,
            show_activity_log,
            show_journal,
            show_stats,
            hide_room_from_public_list
          from public.player_privacy
          where player_id = any($1::text[])
          `,
          [playerIds],
        );
        privacyRows = result.rows ?? [];
      } catch (err) {
        console.error("get-players-view privacy error:", err);
      }

      const privacyByPlayerId = new Map<string, any>();
      for (const pr of privacyRows) {
        if (pr && typeof pr.player_id === "string") {
          privacyByPlayerId.set(pr.player_id, pr);
        }
      }

      // 3) state
      let stateByPlayerId = new Map<string, any>();

      if (needState) {
        try {
          const result = await query(
            `
            select
              player_id,
              garden,
              inventory,
              stats,
              activity_log,
              journal
            from public.player_state
            where player_id = any($1::text[])
            `,
            [playerIds],
          );

          const rows = result.rows ?? [];
          stateByPlayerId = new Map(
            rows
              .filter(
                (st: any) => st && typeof st.player_id === "string",
              )
              .map((st: any) => [st.player_id, st]),
          );
        } catch (err) {
          console.error("get-players-view player_state error:", err);
        }
      }

      // 4) rooms
      let roomIdByPlayerId = new Map<string, string>();
      let roomMap = new Map<string, any>();

      if (needRoom) {
        try {
          const rpResult = await query(
            `
            select player_id, room_id
            from public.room_players
            where left_at is null
              and player_id = any($1::text[])
            `,
            [playerIds],
          );

          const rpRows = rpResult.rows ?? [];
          roomIdByPlayerId = new Map(
            rpRows
              .filter(
                (rp: any) =>
                  rp &&
                  typeof rp.player_id === "string" &&
                  typeof rp.room_id === "string",
              )
              .map((rp: any) => [rp.player_id, rp.room_id]),
          );

          const roomIds = Array.from(
            new Set(
              rpRows
                .map((r: any) => r.room_id)
                .filter(
                  (id: any) =>
                    typeof id === "string" && id.length > 0,
                ),
            ),
          );

          if (roomIds.length > 0) {
            const roomsResult = await query(
              `
              select
                id,
                is_private,
                players_count,
                last_updated_at,
                last_updated_by_player_id,
                user_slots
              from public.rooms
              where id = any($1::text[])
              `,
              [roomIds],
            );

            const roomsRows = roomsResult.rows ?? [];
            roomMap = new Map(
              roomsRows
                .filter(
                  (room: any) =>
                    room && typeof room.id === "string",
                )
                .map((room: any) => [room.id, room]),
            );
          }
        } catch (err) {
          console.error("get-players-view rooms error:", err);
        }
      }

      // 5) construction des vues
      const viewById = new Map<string, any>();

      for (const row of playerRows as any[]) {
        const dbPriv = privacyByPlayerId.get(row.id) ?? null;

        const privacy: PlayerPrivacyPayload = {
          showProfile:
            typeof dbPriv?.show_profile === "boolean"
              ? dbPriv.show_profile
              : DEFAULT_PRIVACY.showProfile,
          showGarden:
            typeof dbPriv?.show_garden === "boolean"
              ? dbPriv.show_garden
              : DEFAULT_PRIVACY.showGarden,
          showInventory:
            typeof dbPriv?.show_inventory === "boolean"
              ? dbPriv.show_inventory
              : DEFAULT_PRIVACY.showInventory,
          showCoins:
            typeof dbPriv?.show_coins === "boolean"
              ? dbPriv.show_coins
              : DEFAULT_PRIVACY.showCoins,
          showActivityLog:
            typeof dbPriv?.show_activity_log === "boolean"
              ? dbPriv.show_activity_log
              : DEFAULT_PRIVACY.showActivityLog,
          showJournal:
            typeof dbPriv?.show_journal === "boolean"
              ? dbPriv.show_journal
              : DEFAULT_PRIVACY.showJournal,
          showStats:
            typeof dbPriv?.show_stats === "boolean"
              ? dbPriv.show_stats
              : DEFAULT_PRIVACY.showStats,
          hideRoomFromPublicList:
            typeof dbPriv?.hide_room_from_public_list === "boolean"
              ? dbPriv.hide_room_from_public_list
              : DEFAULT_PRIVACY.hideRoomFromPublicList,
        };

        let isOnline = false;
        let lastEventAt: string | null = null;

        if (row.last_event_at) {
          lastEventAt = row.last_event_at as string;
          const lastMs = new Date(lastEventAt).getTime();
          if (Number.isFinite(lastMs)) {
            const diff = Date.now() - lastMs;
            if (diff <= MULTI_ONLINE_THRESHOLD_MS) {
              isOnline = true;
            }
          }
        }

        const st = needState
          ? stateByPlayerId.get(row.id) ?? {}
          : {};
        const roomId = needRoom
          ? roomIdByPlayerId.get(row.id)
          : undefined;
        const room =
          needRoom && roomId ? roomMap.get(roomId) ?? null : null;

        const view: any = {
          playerId: row.id,
          hasModInstalled: !!row.has_mod_installed,
          isOnline,
          lastEventAt,
          privacy,
        };

        // profile
        if (needProfile) {
          view.playerName = privacy.showProfile
            ? row.name ?? row.id
            : null;
          view.avatarUrl = privacy.showProfile
            ? row.avatar_url ?? null
            : null;
          view.coins = privacy.showCoins
            ? row.coins ?? null
            : null;
        }

        // room
        if (!sections || sections.has("room")) {
          view.room = room;
        }

        // state
        if (needState) {
          view.state = {
            garden:
              (!sections || sections.has("garden")) &&
              privacy.showGarden
                ? st.garden ?? null
                : null,
            inventory:
              (!sections || sections.has("inventory")) &&
              privacy.showInventory
                ? st.inventory ?? null
                : null,
            stats:
              (!sections || sections.has("stats")) &&
              privacy.showStats
                ? st.stats ?? null
                : null,
            activityLog:
              (!sections || sections.has("activityLog")) &&
              privacy.showActivityLog
                ? st.activity_log ?? null
                : null,
            journal:
              (!sections || sections.has("journal")) &&
              privacy.showJournal
                ? st.journal ?? null
                : null,
          };
        }

        viewById.set(row.id, view);
      }

      const ordered = playerIds
        .map((id) => viewById.get(id))
        .filter((v) => v != null);

      return res.status(200).json(ordered);
    },
  );
}