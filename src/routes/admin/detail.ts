import type { Application, Request, Response } from "express";
import { query } from "../../db";
import { adminAuth } from "./common";

export function registerAdminDetailRoutes(app: Application): void {
  // Full player detail
  app.get(
    "/admin/player/:playerId",
    adminAuth,
    async (req: Request, res: Response) => {
      const playerId = String(req.params.playerId ?? "").trim();
      if (!playerId) {
        res.status(400).json({ error: "Missing playerId" });
        return;
      }

      const routeStart = Date.now();
      res.on("finish", () => {
        console.log(
          `[admin] player detail ${playerId} total ${Date.now() - routeStart}ms status ${res.statusCode}`,
        );
      });
      const timedQuery = async (label: string, text: string, params: unknown[]) => {
        const start = Date.now();
        try {
          return await query(text, params);
        } finally {
          console.log(
            `[admin] player detail ${playerId} ${label} ${Date.now() - start}ms`,
          );
        }
      };

      try {
        const [
          { rows: [player] },
          { rows: [state] },
          { rows: [privacy] },
          { rows: relationships },
          { rows: roomHistory },
          { rows: rateLimitBuckets },
          { rows: msgRateLimitBuckets },
          { rows: [lastIpRow] },
        ] = await Promise.all([
          // 1. Player info
          timedQuery(
            "player",
            `SELECT * FROM public.players WHERE id = $1`,
            [playerId],
          ),
          // 2. State metadata (no full JSON blobs)
          timedQuery(
            "state_meta",
            `SELECT
              garden IS NOT NULL AS has_garden, pg_column_size(garden) AS garden_size,
              inventory IS NOT NULL AS has_inventory, pg_column_size(inventory) AS inventory_size,
              stats IS NOT NULL AS has_stats, pg_column_size(stats) AS stats_size,
              activity_log IS NOT NULL AS has_activity_log, pg_column_size(activity_log) AS activity_log_size,
              journal IS NOT NULL AS has_journal, pg_column_size(journal) AS journal_size,
              updated_at
            FROM public.player_state WHERE player_id = $1`,
            [playerId],
          ),
          // 3. Privacy
          timedQuery(
            "privacy",
            `SELECT * FROM public.player_privacy WHERE player_id = $1`,
            [playerId],
          ),
          // 4. Relationships with other player info
          timedQuery(
            "relationships",
            `SELECT
              r.user_one_id, r.user_two_id, r.requested_by,
              r.status, r.created_at, r.updated_at,
              CASE WHEN r.user_one_id = $1 THEN r.user_two_id ELSE r.user_one_id END AS other_player_id,
              p.name AS other_player_name,
              p.avatar_url AS other_player_avatar_url
            FROM public.player_relationships r
            LEFT JOIN public.players p
              ON p.id = CASE WHEN r.user_one_id = $1 THEN r.user_two_id ELSE r.user_one_id END
            WHERE r.user_one_id = $1 OR r.user_two_id = $1
            ORDER BY r.created_at DESC
            LIMIT 200`,
            [playerId],
          ),
          // 5. Room history
          timedQuery(
            "room_history",
            `SELECT rp.room_id, rp.joined_at, rp.left_at,
              r.is_private, r.players_count
            FROM public.room_players rp
            JOIN public.rooms r ON r.id = rp.room_id
            WHERE rp.player_id = $1
            ORDER BY rp.joined_at DESC
            LIMIT 50`,
            [playerId],
          ),
          // 6. Rate limit buckets
          timedQuery(
            "rate_limits",
            `SELECT bucket_start, ip, hit_count
            FROM public.rate_limit_usage
            WHERE player_id = $1
            ORDER BY bucket_start DESC
            LIMIT 50`,
            [playerId],
          ),
          // 7. Message rate limit buckets
          timedQuery(
            "msg_rate_limits",
            `SELECT bucket_start, ip, hit_count
            FROM public.message_rate_limit_usage
            WHERE player_id = $1
            ORDER BY bucket_start DESC
            LIMIT 50`,
            [playerId],
          ),
          // 8. Last known IP
          timedQuery(
            "last_ip",
            `SELECT ip FROM public.rate_limit_usage
            WHERE player_id = $1 AND ip IS NOT NULL
            ORDER BY bucket_start DESC
            LIMIT 1`,
            [playerId],
          ),
        ]);

        if (!player) {
          res.status(404).json({ error: "Player not found" });
          return;
        }

        res.json({
          player,
          state: state ?? null,
          privacy: privacy ?? null,
          relationships,
          room_history: roomHistory,
          rate_limit_buckets: rateLimitBuckets,
          message_rate_limit_buckets: msgRateLimitBuckets,
          last_known_ip: lastIpRow?.ip ?? null,
        });
      } catch (err) {
        console.error("[admin] player detail error:", err);
        res.status(500).json({ error: "DB error" });
      }
    },
  );

  // Full room detail
  app.get(
    "/admin/room/:roomId",
    adminAuth,
    async (req: Request, res: Response) => {
      const roomId = String(req.params.roomId ?? "").trim();
      if (!roomId) {
        res.status(400).json({ error: "Missing roomId" });
        return;
      }

      try {
        const [
          { rows: [room] },
          { rows: currentPlayers },
          { rows: playerHistory },
          { rows: messages },
          { rows: [updatedBy] },
        ] = await Promise.all([
          // 1. Room info (without user_slots blob)
          query(
            `SELECT id, is_private, players_count, last_updated_at, created_at,
              last_updated_by_player_id,
              user_slots IS NOT NULL AS has_user_slots,
              pg_column_size(user_slots) AS user_slots_size
            FROM public.rooms WHERE id = $1`,
            [roomId],
          ),
          // 2. Current players
          query(
            `SELECT rp.player_id, rp.joined_at,
              p.name, p.avatar_url
            FROM public.room_players rp
            JOIN public.players p ON p.id = rp.player_id
            WHERE rp.room_id = $1 AND rp.left_at IS NULL
            ORDER BY rp.joined_at DESC`,
            [roomId],
          ),
          // 3. Player history
          query(
            `SELECT rp.player_id, rp.joined_at, rp.left_at,
              p.name, p.avatar_url
            FROM public.room_players rp
            JOIN public.players p ON p.id = rp.player_id
            WHERE rp.room_id = $1
            ORDER BY rp.joined_at DESC
            LIMIT 100`,
            [roomId],
          ),
          // 4. Messages from this room
          query(
            `SELECT dm.id, dm.sender_id, dm.recipient_id, dm.body,
              dm.created_at, dm.read_at,
              ps.name AS sender_name, pr.name AS recipient_name
            FROM public.direct_messages dm
            LEFT JOIN public.players ps ON ps.id = dm.sender_id
            LEFT JOIN public.players pr ON pr.id = dm.recipient_id
            WHERE dm.room_id = $1
            ORDER BY dm.created_at DESC
            LIMIT 50`,
            [roomId],
          ),
          // 5. Last updated by
          query(
            `SELECT p.id, p.name, p.avatar_url
            FROM public.players p
            WHERE p.id = (SELECT last_updated_by_player_id FROM public.rooms WHERE id = $1)`,
            [roomId],
          ),
        ]);

        if (!room) {
          res.status(404).json({ error: "Room not found" });
          return;
        }

        res.json({
          room,
          current_players: currentPlayers,
          player_history: playerHistory,
          messages,
          updated_by: updatedBy ?? null,
        });
      } catch (err) {
        console.error("[admin] room detail error:", err);
        res.status(500).json({ error: "DB error" });
      }
    },
  );

  // Lazy-load individual player state field
  const ALLOWED_STATE_FIELDS = new Set([
    "garden",
    "inventory",
    "stats",
    "activity_log",
    "journal",
  ]);

  app.get(
    "/admin/player/:playerId/state/:field",
    adminAuth,
    async (req: Request, res: Response) => {
      const playerId = String(req.params.playerId ?? "").trim();
      const field = String(req.params.field ?? "").trim();

      if (!playerId) {
        res.status(400).json({ error: "Missing playerId" });
        return;
      }
      if (!ALLOWED_STATE_FIELDS.has(field)) {
        res.status(400).json({ error: "Invalid field" });
        return;
      }

      try {
        const {
          rows: [row],
        } = await query(
          `SELECT ${field} FROM public.player_state WHERE player_id = $1`,
          [playerId],
        );

        if (!row) {
          res.status(404).json({ error: "No state found" });
          return;
        }

        res.json({ field, data: row[field] });
      } catch (err) {
        console.error("[admin] player state field error:", err);
        res.status(500).json({ error: "DB error" });
      }
    },
  );

  // Lazy-load conversations list for a player
  app.get(
    "/admin/player/:playerId/conversations",
    adminAuth,
    async (req: Request, res: Response) => {
      const playerId = String(req.params.playerId ?? "").trim();
      if (!playerId) {
        res.status(400).json({ error: "Missing playerId" });
        return;
      }

      try {
        const { rows } = await query(
          `SELECT
            sub.other_id,
            p.name AS other_name,
            p.avatar_url AS other_avatar,
            sub.last_body,
            sub.last_at,
            sub.msg_count
          FROM (
            SELECT
              CASE WHEN dm.sender_id = $1 THEN dm.recipient_id ELSE dm.sender_id END AS other_id,
              count(*)::int AS msg_count,
              max(dm.created_at) AS last_at,
              (array_agg(dm.body ORDER BY dm.created_at DESC))[1] AS last_body
            FROM public.direct_messages dm
            WHERE dm.sender_id = $1 OR dm.recipient_id = $1
            GROUP BY other_id
          ) sub
          LEFT JOIN public.players p ON p.id = sub.other_id
          ORDER BY sub.last_at DESC
          LIMIT 50`,
          [playerId],
        );

        res.json({ conversations: rows });
      } catch (err) {
        console.error("[admin] conversations error:", err);
        res.status(500).json({ error: "DB error" });
      }
    },
  );

  // Lazy-load messages between player and another player
  app.get(
    "/admin/player/:playerId/messages/:otherId",
    adminAuth,
    async (req: Request, res: Response) => {
      const playerId = String(req.params.playerId ?? "").trim();
      const otherId = String(req.params.otherId ?? "").trim();
      if (!playerId || !otherId) {
        res.status(400).json({ error: "Missing playerId or otherId" });
        return;
      }

      try {
        const { rows } = await query(
          `SELECT dm.id, dm.sender_id, dm.recipient_id, dm.body,
            dm.created_at, dm.read_at, dm.room_id
          FROM public.direct_messages dm
          WHERE (dm.sender_id = $1 AND dm.recipient_id = $2)
             OR (dm.sender_id = $2 AND dm.recipient_id = $1)
          ORDER BY dm.created_at ASC
          LIMIT 100`,
          [playerId, otherId],
        );

        res.json({ messages: rows });
      } catch (err) {
        console.error("[admin] player messages error:", err);
        res.status(500).json({ error: "DB error" });
      }
    },
  );

  // Lazy-load room user_slots
  app.get(
    "/admin/room/:roomId/slots",
    adminAuth,
    async (req: Request, res: Response) => {
      const roomId = String(req.params.roomId ?? "").trim();
      if (!roomId) {
        res.status(400).json({ error: "Missing roomId" });
        return;
      }

      try {
        const {
          rows: [row],
        } = await query(
          `SELECT user_slots FROM public.rooms WHERE id = $1`,
          [roomId],
        );

        if (!row) {
          res.status(404).json({ error: "Room not found" });
          return;
        }

        res.json({ user_slots: row.user_slots });
      } catch (err) {
        console.error("[admin] room slots error:", err);
        res.status(500).json({ error: "DB error" });
      }
    },
  );
}
