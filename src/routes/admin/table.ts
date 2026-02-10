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
    const orderByRaw = String(req.query.orderBy || "").trim();
    const orderDirRaw = String(req.query.orderDir || "").toLowerCase();
    const orderDir = orderDirRaw === "desc" ? "desc" : "asc";
    const isSafeIdentifier = /^[a-zA-Z0-9_]+$/;
    const hasOrder = orderByRaw.length > 0 && isSafeIdentifier.test(orderByRaw);

    if (STATS_SOURCES.has(table)) {
      let sql: string;
      let allowedOrder: Set<string>;
      let orderClause = "";

      if (table === "stats_requests_per_player") {
        allowedOrder = new Set(["player_id", "total_requests"]);
        if (hasOrder && !allowedOrder.has(orderByRaw)) {
          res.status(400).json({ error: "Unsupported order column" });
          return;
        }
        orderClause = hasOrder
          ? `order by "${orderByRaw}" ${orderDir}`
          : "order by total_requests desc";
        sql = `
          select
            player_id,
            sum(hit_count) as total_requests
          from public.rate_limit_usage
          where player_id is not null
          group by player_id
          ${orderClause}
          limit $1 offset $2
        `;
      } else if (table === "stats_requests_per_day") {
        allowedOrder = new Set(["day", "total_requests"]);
        if (hasOrder && !allowedOrder.has(orderByRaw)) {
          res.status(400).json({ error: "Unsupported order column" });
          return;
        }
        orderClause = hasOrder
          ? `order by "${orderByRaw}" ${orderDir}`
          : "order by day desc";
        sql = `
          select
            date(bucket_start) as day,
            sum(hit_count) as total_requests
          from public.rate_limit_usage
          group by date(bucket_start)
          ${orderClause}
          limit $1 offset $2
        `;
      } else if (table === "stats_requests_per_month") {
        allowedOrder = new Set(["month", "total_requests"]);
        if (hasOrder && !allowedOrder.has(orderByRaw)) {
          res.status(400).json({ error: "Unsupported order column" });
          return;
        }
        orderClause = hasOrder
          ? `order by "${orderByRaw}" ${orderDir}`
          : "order by month desc";
        sql = `
          select
            to_char(bucket_start, 'YYYY-MM') as month,
            sum(hit_count) as total_requests
          from public.rate_limit_usage
          group by to_char(bucket_start, 'YYYY-MM')
          ${orderClause}
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
    if (hasOrder) {
      orderClause = `order by "${orderByRaw}" ${orderDir} nulls last`;
    } else if (table === "players") {
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
      orderClause = "order by blocked_at desc nulls last";
    } else if (table === "direct_messages") {
      orderClause = "order by created_at desc nulls last";
    } else if (table === "message_rate_limit_usage") {
      orderClause = "order by bucket_start desc nulls last";
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
