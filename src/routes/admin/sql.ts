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

  // Lookup player (by id or name) + state + rate-limit summary
  app.post(
    "/admin/form/player-lookup",
    adminAuth,
    async (req: Request, res: Response) => {
      const body = (req.body ?? {}) as {
        type?: string;
        value?: string;
        playerId?: string | null; // compat ancien format
        name?: string | null;
      };

      // Format normal: { type, value }
      let type = body.type ?? "";
      let value =
        typeof body.value === "string" ? body.value.trim() : "";

      // Compat : si un jour tu envoies { playerId, name }
      if (!type && (body.playerId || body.name)) {
        if (body.playerId) {
          type = "playerId";
          value = String(body.playerId).trim();
        } else if (body.name) {
          type = "name";
          value = String(body.name).trim();
        }
      }

      if (!value || (type === "name" && value.length < 2)) {
        res.status(400).json({
          error: "Provide playerId or name (at least 2 chars)",
        });
        return;
      }

      if (type !== "playerId" && type !== "name") {
        res.status(400).json({ error: "Unknown lookup type" });
        return;
      }

      // Aligné avec TON schéma :
      // players: id, name, avatar_url, coins, last_event_at, created_at, has_mod_installed
      // player_state: player_id, garden, inventory, stats, updated_at, activity_log, journal
      // rate_limit_usage: player_id, ip, bucket_start, hit_count
      const baseSelect = `
        select
          p.id as player_id,
          p.name,
          p.avatar_url,
          p.coins,
          p.last_event_at,
          p.created_at,
          p.has_mod_installed,
          rl_recent.ip as ip,
          ps.garden,
          ps.inventory,
          ps.stats,
          ps.activity_log,
          ps.journal,
          ps.updated_at as state_updated_at,
          coalesce(rl.total_requests, 0) as total_requests,
          cur_room.room_id as current_room_id,
          cur_room.is_private as current_room_is_private
        from public.players p
        left join public.player_state ps
          on ps.player_id = p.id
        left join lateral (
          select sum(hit_count) as total_requests
          from public.rate_limit_usage
          where player_id = p.id
        ) rl on true
        left join lateral (
          select ip
          from public.rate_limit_usage
          where player_id = p.id
            and ip is not null
          order by bucket_start desc
          limit 1
        ) rl_recent on true
        left join lateral (
          select rp.room_id, r.is_private
          from public.room_players rp
          join public.rooms r on r.id = rp.room_id
          where rp.player_id = p.id
            and rp.left_at is null
          order by rp.joined_at desc
          limit 1
        ) cur_room on true
      `;


      let whereClause: string;
      const params: any[] = [];

      if (type === "playerId") {
        whereClause = "where p.id = $1";
        params.push(value);
      } else {
        whereClause = "where lower(p.name) like lower('%' || $1 || '%')";
        params.push(value);
      }

      const sql = `
        ${baseSelect}
        ${whereClause}
        order by p.created_at desc
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
}
