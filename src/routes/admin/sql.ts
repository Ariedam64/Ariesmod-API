import type { Application, Request, Response } from "express";
import { query } from "../../db";
import { adminAuth } from "./common";

export function registerAdminSqlAndToolsRoutes(app: Application): void {
  // Console SQL read-only
  app.post("/admin/sql", adminAuth, async (req: Request, res: Response) => {
    const raw = (req.body as any)?.query;
    const sqlInput = String(raw ?? "").trim();

    if (!sqlInput) {
      res.status(400).json({ error: "Empty query" });
      return;
    }

    const lower = sqlInput.toLowerCase();

    // Authorize CTEs and common formatting: accept with leading "with" or whitespace before select
    if (!lower.startsWith("select") && !lower.startsWith("with")) {
      res
        .status(400)
        .json({ error: "Only SELECT queries are allowed in this console" });
      return;
    }

    if (
      lower.includes("insert ") ||
      lower.includes("update ") ||
      lower.includes("delete ")
    ) {
      res.status(400).json({ error: "Only SELECT queries are allowed" });
      return;
    }

    if (
      lower.includes("drop ") ||
      lower.includes("alter ") ||
      lower.includes("truncate ")
    ) {
      res.status(400).json({ error: "Dangerous statements are not allowed" });
      return;
    }

    try {
      const { rows } = await query(sqlInput, []);
      res.json({ rows });
    } catch (err) {
      console.error("[admin] sql console error:", err);
      res.status(500).json({ error: "DB error" });
    }
  });

  // Lookup player (by id or name) + lightweight metadata
  app.post(
    "/admin/form/player-lookup",
    adminAuth,
    async (req: Request, res: Response) => {
      const body = (req.body ?? {}) as {
        query?: string;
        filters?: string[];
        // Legacy compat
        type?: string;
        value?: string;
        playerId?: string | null;
        name?: string | null;
      };

      let searchQuery =
        typeof body.query === "string" ? body.query.trim() : "";
      const filters = Array.isArray(body.filters) ? body.filters : [];

      // Legacy compat
      if (!searchQuery && body.value) {
        searchQuery = String(body.value).trim();
      }
      if (!searchQuery && body.playerId) {
        searchQuery = String(body.playerId).trim();
      }
      if (!searchQuery && body.name) {
        searchQuery = String(body.name).trim();
      }

      const hasFilters = filters.length > 0;

      if (!searchQuery && !hasFilters) {
        res.status(400).json({
          error: "Provide a search query or at least one filter",
        });
        return;
      }

      if (searchQuery && searchQuery.length < 2) {
        res.status(400).json({ error: "Search must be at least 2 chars" });
        return;
      }

      // Optimized: removed heavy LATERAL joins, direct simple query
      const whereParts: string[] = [];
      const params: any[] = [];

      if (searchQuery) {
        params.push(searchQuery);
        // Auto-detect: try exact ID match OR name LIKE
        whereParts.push(
          `(p.id = $${params.length} OR lower(p.name) like lower('%' || $${params.length} || '%'))`,
        );
      }

      for (const f of filters) {
        if (f === "online") {
          whereParts.push(
            `p.last_event_at >= now() - interval '5 minutes'`,
          );
        } else if (f === "has_mod") {
          whereParts.push(`p.has_mod_installed = true`);
        } else if (f === "new_week") {
          whereParts.push(`p.created_at >= now() - interval '7 days'`);
        }
      }

      const whereClause = whereParts.length
        ? "where " + whereParts.join(" and ")
        : "";

      // Simplified fast query - just core player data
      const sql = `
        select
          p.id as player_id,
          p.name,
          p.avatar_url,
          p.coins,
          p.last_event_at,
          p.created_at,
          p.has_mod_installed,
          p.mod_version
        from public.players p
        ${whereClause}
        order by p.last_event_at desc nulls last
        limit 50
      `;

      try {
        const { rows } = await query(sql, params);
        res.json({ rows });
      } catch (err) {
        console.error("[admin] player-lookup error:", err);
        res.status(500).json({ error: "DB error" });
      }
    },
  );

  // Friends de ce player (basé sur player_relationships)
  app.post(
    "/admin/form/player-friends",
    adminAuth,
    async (req: Request, res: Response) => {
      const body = (req.body ?? {}) as { playerId?: string | null };
      const rawPlayerId =
        typeof body.playerId === "string" ? body.playerId.trim() : "";

      if (!rawPlayerId) {
        res.status(400).json({ error: "Missing playerId" });
        return;
      }

      // Schéma réel:
      // player_relationships(user_one_id, user_two_id, requested_by, status, created_at, updated_at)
      // On veut toutes les relations où ce player est user_one_id OU user_two_id
      // + la colonne "other_player_id" calculée.
      const sql = `
        select
          r.user_one_id,
          r.user_two_id,
          r.requested_by,
          r.status,
          r.created_at,
          r.updated_at,
          case
            when r.user_one_id = $1 then r.user_two_id
            else r.user_one_id
          end as other_player_id
        from public.player_relationships r
        where r.user_one_id = $1
           or r.user_two_id = $1
        order by r.created_at desc
        limit 200
      `;

      try {
        const { rows } = await query(sql, [rawPlayerId]);
        res.json({ rows });
      } catch (err) {
        console.error("[admin] player-friends error:", err);
        res.status(500).json({ error: "DB error" });
      }
    },
  );

  // Room lookup
  app.post(
    "/admin/form/room-lookup",
    adminAuth,
    async (req: Request, res: Response) => {
      const body = (req.body ?? {}) as { type?: string; value?: string };
      const type = String(body.type ?? "").trim();
      const value = String(body.value ?? "").trim();

      if (!value) {
        res.status(400).json({ error: "Provide a value" });
        return;
      }

      if (type !== "roomId" && type !== "playerId") {
        res.status(400).json({ error: "type must be roomId or playerId" });
        return;
      }

      let sql: string;
      const params: any[] = [value];

      if (type === "roomId") {
        sql = `
          SELECT r.*,
            (SELECT count(*)::integer FROM public.room_players rp
             WHERE rp.room_id = r.id AND rp.left_at IS NULL) AS current_player_count
          FROM public.rooms r
          WHERE r.id ILIKE '%' || $1 || '%'
          ORDER BY r.last_updated_at DESC NULLS LAST
          LIMIT 50
        `;
      } else {
        sql = `
          SELECT DISTINCT r.*,
            (SELECT count(*)::integer FROM public.room_players rp2
             WHERE rp2.room_id = r.id AND rp2.left_at IS NULL) AS current_player_count
          FROM public.rooms r
          JOIN public.room_players rp ON rp.room_id = r.id
          WHERE rp.player_id = $1
          ORDER BY r.last_updated_at DESC NULLS LAST
          LIMIT 50
        `;
      }

      try {
        const { rows } = await query(sql, params);
        res.json({ rows });
      } catch (err) {
        console.error("[admin] room-lookup error:", err);
        res.status(500).json({ error: "DB error" });
      }
    },
  );

  // Message lookup
  app.post(
    "/admin/form/message-lookup",
    adminAuth,
    async (req: Request, res: Response) => {
      const body = (req.body ?? {}) as { type?: string; value?: string };
      const type = String(body.type ?? "").trim();
      const value = String(body.value ?? "").trim();

      if (!value) {
        res.status(400).json({ error: "Provide a value" });
        return;
      }

      if (!["playerId", "conversationId", "content"].includes(type)) {
        res
          .status(400)
          .json({ error: "type must be playerId, conversationId, or content" });
        return;
      }

      const params: any[] = [value];
      let whereClause: string;

      if (type === "playerId") {
        whereClause = "WHERE dm.sender_id = $1 OR dm.recipient_id = $1";
      } else if (type === "conversationId") {
        whereClause = "WHERE dm.conversation_id = $1";
      } else {
        whereClause = "WHERE dm.body ILIKE '%' || $1 || '%'";
      }

      const sql = `
        SELECT dm.id, dm.conversation_id, dm.sender_id, dm.recipient_id,
          dm.room_id, dm.body, dm.created_at, dm.read_at,
          ps.name AS sender_name, pr.name AS recipient_name
        FROM public.direct_messages dm
        LEFT JOIN public.players ps ON ps.id = dm.sender_id
        LEFT JOIN public.players pr ON pr.id = dm.recipient_id
        ${whereClause}
        ORDER BY dm.created_at DESC
        LIMIT 50
      `;

      try {
        const { rows } = await query(sql, params);
        res.json({ rows });
      } catch (err) {
        console.error("[admin] message-lookup error:", err);
        res.status(500).json({ error: "DB error" });
      }
    },
  );

  // Rate-limit usage pour un playerId et/ou IP
  app.post(
    "/admin/form/rate-limit-player",
    adminAuth,
    async (req: Request, res: Response) => {
      const body = (req.body ?? {}) as {
        playerId?: string | null;
        ip?: string | null;
      };

      const playerId =
        typeof body.playerId === "string" ? body.playerId.trim() : "";
      const ip = typeof body.ip === "string" ? body.ip.trim() : "";

      if (!playerId && !ip) {
        res.status(400).json({ error: "Provide at least a playerId or IP" });
        return;
      }

      const params: any[] = [];
      const whereClauses: string[] = [];

      if (playerId) {
        params.push(playerId);
        whereClauses.push(`player_id = $${params.length}`);
      }
      if (ip) {
        params.push(ip);
        whereClauses.push(`ip = $${params.length}`);
      }

      const whereSql = whereClauses.length
        ? "where " + whereClauses.join(" and ")
        : "";

      const sql = `
        select bucket_start, ip, player_id, hit_count
        from public.rate_limit_usage
        ${whereSql}
        order by bucket_start desc
        limit 200
      `;

      try {
        const { rows } = await query(sql, params);
        res.json({ rows });
      } catch (err) {
        console.error("[admin] rate-limit-player error:", err);
        res.status(500).json({ error: "DB error" });
      }
    },
  );

  // Mutual friends between two players
  app.post(
    "/admin/form/mutual-friends",
    adminAuth,
    async (req: Request, res: Response) => {
      const body = (req.body ?? {}) as {
        playerA?: string | null;
        playerB?: string | null;
      };

      const playerA =
        typeof body.playerA === "string" ? body.playerA.trim() : "";
      const playerB =
        typeof body.playerB === "string" ? body.playerB.trim() : "";

      if (!playerA || !playerB) {
        res
          .status(400)
          .json({ error: "Provide both playerA and playerB IDs" });
        return;
      }

      const sql = `
        select p.id, p.name, p.avatar_url, p.last_event_at
        from public.players p
        where p.id in (
          select case when r.user_one_id = $1 then r.user_two_id else r.user_one_id end
          from public.player_relationships r
          where (r.user_one_id = $1 or r.user_two_id = $1)
            and r.status = 'accepted'
        )
        and p.id in (
          select case when r.user_one_id = $2 then r.user_two_id else r.user_one_id end
          from public.player_relationships r
          where (r.user_one_id = $2 or r.user_two_id = $2)
            and r.status = 'accepted'
        )
        order by p.last_event_at desc nulls last
        limit 100
      `;

      try {
        const { rows } = await query(sql, [playerA, playerB]);
        res.json({ rows });
      } catch (err) {
        console.error("[admin] mutual-friends error:", err);
        res.status(500).json({ error: "DB error" });
      }
    },
  );

  // Conversation between two specific players
  app.post(
    "/admin/form/conversation-between",
    adminAuth,
    async (req: Request, res: Response) => {
      const body = (req.body ?? {}) as {
        playerA?: string | null;
        playerB?: string | null;
      };

      const playerA =
        typeof body.playerA === "string" ? body.playerA.trim() : "";
      const playerB =
        typeof body.playerB === "string" ? body.playerB.trim() : "";

      if (!playerA || !playerB) {
        res
          .status(400)
          .json({ error: "Provide both playerA and playerB IDs" });
        return;
      }

      const sql = `
        select dm.id, dm.conversation_id, dm.sender_id, dm.recipient_id,
          dm.room_id, dm.body, dm.created_at, dm.read_at,
          ps.name as sender_name, pr.name as recipient_name
        from public.direct_messages dm
        left join public.players ps on ps.id = dm.sender_id
        left join public.players pr on pr.id = dm.recipient_id
        where (dm.sender_id = $1 and dm.recipient_id = $2)
           or (dm.sender_id = $2 and dm.recipient_id = $1)
        order by dm.created_at desc
        limit 50
      `;

      try {
        const { rows } = await query(sql, [playerA, playerB]);
        res.json({ rows });
      } catch (err) {
        console.error("[admin] conversation-between error:", err);
        res.status(500).json({ error: "DB error" });
      }
    },
  );
}
