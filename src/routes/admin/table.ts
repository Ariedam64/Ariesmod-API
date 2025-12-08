import type { Application, Request, Response } from "express";
import { query } from "../../db";
import {
  adminAuth,
  clampNumber,
  REAL_TABLES,
  STATS_SOURCES,
} from "./common";

export function registerAdminTableRoutes(app: Application): void {
  app.get("/admin/table", adminAuth, async (req: Request, res: Response) => {
    const table = String(req.query.table || "").trim();

    if (!REAL_TABLES.has(table) && !STATS_SOURCES.has(table)) {
      res.status(400).json({ error: "Unknown or forbidden source" });
      return;
    }

    const limit = clampNumber(req.query.limit, 100, 1, 500);
    const offset = clampNumber(req.query.offset, 0, 0, 100000);

    if (STATS_SOURCES.has(table)) {
      let sql: string;

      if (table === "stats_requests_per_player") {
        sql = `
          select
            player_id,
            sum(hit_count) as total_requests
          from public.rate_limit_usage
          where player_id is not null
          group by player_id
          order by total_requests desc
          limit $1 offset $2
        `;
      } else if (table === "stats_requests_per_day") {
        sql = `
          select
            date(bucket_start) as day,
            sum(hit_count) as total_requests
          from public.rate_limit_usage
          group by date(bucket_start)
          order by day desc
          limit $1 offset $2
        `;
      } else if (table === "stats_requests_per_month") {
        sql = `
          select
            to_char(bucket_start, 'YYYY-MM') as month,
            sum(hit_count) as total_requests
          from public.rate_limit_usage
          group by to_char(bucket_start, 'YYYY-MM')
          order by month desc
          limit $1 offset $2
        `;
      } else {
        res.status(400).json({ error: "Unknown stats source" });
        return;
      }

      try {
        const { rows } = await query(sql, [limit, offset]);
        res.json({ rows });
      } catch (err) {
        console.error("[admin] stats query error:", err);
        res.status(500).json({ error: "DB error (stats)" });
      }
      return;
    }

    let orderClause = "";
    if (table === "players") {
      orderClause = "order by coins desc nulls last";
    } else if (table === "rooms") {
      orderClause = "order by last_updated_at desc nulls last";
    } else if (table === "player_state") {
      orderClause = "order by updated_at desc nulls last";
    } else if (table === "player_relationships") {
      orderClause = "order by created_at desc nulls last";
    } else if (table === "rate_limit_usage") {
      orderClause = "order by bucket_start desc nulls last";
    } else if (table === "blocked_ips") {
      orderClause = "order by created_at desc nulls last";
    }

    const sql = `
      select *
      from public.${table}
      ${orderClause}
      limit $1 offset $2
    `;

    try {
      const { rows } = await query(sql, [limit, offset]);
      res.json({ rows });
    } catch (err) {
      console.error("[admin] table query error:", err);
      res.status(500).json({ error: "DB error" });
    }
  });

  // Console SQL read-only

}
