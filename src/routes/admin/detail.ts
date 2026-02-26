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
          { rows: [leaderboard] },
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
          // 9. Leaderboard stats
          timedQuery(
            "leaderboard",
            `SELECT ls.coins_rank, ls.eggs_rank, ls.coins, ls.eggs_hatched,
              ls.coins_rank_snapshot_24h, ls.eggs_rank_snapshot_24h
            FROM public.leaderboard_stats ls
            WHERE ls.player_id = $1`,
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
          leaderboard: leaderboard ?? null,
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
              admin_privacy_override,
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
          `SELECT * FROM (
            SELECT dm.id, dm.sender_id, dm.recipient_id, dm.body,
              dm.created_at, dm.read_at
            FROM public.direct_messages dm
            WHERE (dm.sender_id = $1 AND dm.recipient_id = $2)
               OR (dm.sender_id = $2 AND dm.recipient_id = $1)
            ORDER BY dm.created_at DESC
            LIMIT 100
          ) sub ORDER BY created_at ASC`,
          [playerId, otherId],
        );

        res.json({ messages: rows });
      } catch (err) {
        console.error("[admin] player messages error:", err);
        res.status(500).json({ error: "DB error" });
      }
    },
  );

  // Player groups list (for admin UI)
  app.get(
    "/admin/player/:playerId/groups",
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
            g.id AS group_id,
            g.name AS group_name,
            g.owner_id,
            gm.role,
            gm.joined_at,
            cnt.member_count,
            lm.last_body,
            lm.last_at,
            lm.last_sender_id,
            ps.name AS last_sender_name
          FROM public.group_members gm
          JOIN public.groups g ON g.id = gm.group_id
          LEFT JOIN LATERAL (
            SELECT count(*)::int AS member_count
            FROM public.group_members gm2
            WHERE gm2.group_id = g.id
          ) cnt ON true
          LEFT JOIN LATERAL (
            SELECT body AS last_body,
              created_at AS last_at,
              sender_id AS last_sender_id
            FROM public.group_messages gm3
            WHERE gm3.group_id = g.id
            ORDER BY gm3.created_at DESC
            LIMIT 1
          ) lm ON true
          LEFT JOIN public.players ps ON ps.id = lm.last_sender_id
          WHERE gm.player_id = $1
          ORDER BY lm.last_at DESC NULLS LAST, g.updated_at DESC
          LIMIT 50`,
          [playerId],
        );

        res.json({ groups: rows });
      } catch (err) {
        console.error("[admin] player groups error:", err);
        res.status(500).json({ error: "DB error" });
      }
    },
  );

  // Lazy-load group messages for a player's group
  app.get(
    "/admin/player/:playerId/group-messages/:groupId",
    adminAuth,
    async (req: Request, res: Response) => {
      const playerId = String(req.params.playerId ?? "").trim();
      const groupIdRaw = String(req.params.groupId ?? "").trim();
      const groupId = Number(groupIdRaw);
      if (!playerId || !Number.isFinite(groupId) || groupId <= 0) {
        res.status(400).json({ error: "Invalid playerId or groupId" });
        return;
      }

      try {
        const { rows: membership } = await query(
          `SELECT 1
          FROM public.group_members
          WHERE group_id = $1 AND player_id = $2
          LIMIT 1`,
          [groupId, playerId],
        );
        if (!membership[0]) {
          res.status(404).json({ error: "Group not found for player" });
          return;
        }
      } catch (err) {
        console.error("[admin] player group membership error:", err);
        res.status(500).json({ error: "DB error" });
        return;
      }

      try {
        const [
          { rows: [group] },
          { rows: messages },
        ] = await Promise.all([
          query(
            `SELECT g.id, g.name,
              (SELECT count(*)::int FROM public.group_members WHERE group_id = g.id) AS member_count
            FROM public.groups g
            WHERE g.id = $1`,
            [groupId],
          ),
          query(
            `SELECT gm.id, gm.sender_id, gm.body, gm.created_at,
              p.name AS sender_name
            FROM public.group_messages gm
            LEFT JOIN public.players p ON p.id = gm.sender_id
            WHERE gm.group_id = $1
            ORDER BY gm.created_at DESC
            LIMIT 100`,
            [groupId],
          ),
        ]);

        res.json({ group: group ?? null, messages });
      } catch (err) {
        console.error("[admin] player group messages error:", err);
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

  // Full group detail
  app.get(
    "/admin/group/:groupId",
    adminAuth,
    async (req: Request, res: Response) => {
      const groupIdRaw = String(req.params.groupId ?? "").trim();
      const groupId = Number(groupIdRaw);
      if (!Number.isFinite(groupId) || groupId <= 0) {
        res.status(400).json({ error: "Invalid groupId" });
        return;
      }

      try {
        const [
          { rows: [group] },
          { rows: members },
          { rows: messages },
          { rows: activity },
          { rows: [stats] },
        ] = await Promise.all([
          query(
            `SELECT g.id, g.name, g.is_public, g.owner_id, g.created_at, g.updated_at,
              p.name AS owner_name, p.avatar_url AS owner_avatar_url
            FROM public.groups g
            LEFT JOIN public.players p ON p.id = g.owner_id
            WHERE g.id = $1`,
            [groupId],
          ),
          query(
            `SELECT gm.player_id, gm.role, gm.joined_at,
              p.name, p.avatar_url, p.last_event_at
            FROM public.group_members gm
            LEFT JOIN public.players p ON p.id = gm.player_id
            WHERE gm.group_id = $1
            ORDER BY gm.joined_at ASC`,
            [groupId],
          ),
          query(
            `SELECT gm.id, gm.sender_id, gm.body, gm.created_at,
              p.name AS sender_name
            FROM public.group_messages gm
            LEFT JOIN public.players p ON p.id = gm.sender_id
            WHERE gm.group_id = $1
            ORDER BY gm.created_at DESC
            LIMIT 100`,
            [groupId],
          ),
          query(
            `SELECT ga.id, ga.type, ga.actor_id, ga.member_id, ga.meta, ga.created_at,
              pa.name AS actor_name,
              pm.name AS member_name
            FROM public.group_activity ga
            LEFT JOIN public.players pa ON pa.id = ga.actor_id
            LEFT JOIN public.players pm ON pm.id = ga.member_id
            WHERE ga.group_id = $1
            ORDER BY ga.created_at DESC
            LIMIT 50`,
            [groupId],
          ),
          query(
            `SELECT
              (SELECT count(*)::int FROM public.group_members WHERE group_id = $1) AS member_count,
              (SELECT count(*)::int FROM public.group_messages WHERE group_id = $1) AS message_count,
              (SELECT max(created_at) FROM public.group_messages WHERE group_id = $1) AS last_message_at,
              (SELECT max(created_at) FROM public.group_activity WHERE group_id = $1) AS last_activity_at`,
            [groupId],
          ),
        ]);

        if (!group) {
          res.status(404).json({ error: "Group not found" });
          return;
        }

        res.json({
          group,
          members,
          messages,
          activity,
          stats: stats ?? null,
        });
      } catch (err) {
        console.error("[admin] group detail error:", err);
        res.status(500).json({ error: "DB error" });
      }
    },
  );
}
