import type { Application, Request, Response } from "express";
import { query } from "../../db";
import { adminAuth, clampNumber } from "./common";

export function registerAdminGroupsRoutes(app: Application): void {
  // Groups overview (stats)
  app.get("/admin/groups-view", adminAuth, async (_req, res: Response) => {
    try {
      const { rows } = await query(
        `
        select
          (select count(*)::int from public.groups) as total,
          (select count(*)::int from public.groups where created_at >= now() - interval '24 hours') as new_24h,
          (select count(*)::int from public.groups where created_at >= now() - interval '7 days') as new_7d,
          (select count(*)::int from public.groups where updated_at >= now() - interval '24 hours') as updated_24h,
          (select count(*)::int from public.group_members) as total_members,
          (select coalesce(avg(cnt),0)::numeric(10,2) from (
            select count(*)::int as cnt
            from public.group_members
            group by group_id
          ) s) as avg_members,
          (select count(*)::int from public.group_messages) as total_messages,
          (select count(*)::int from public.group_messages where created_at >= now() - interval '24 hours') as messages_24h
        `,
      );

      res.json({
        ts: new Date().toISOString(),
        stats: rows[0] ?? null,
      });
    } catch (err) {
      console.error("[admin] groups-view error:", err);
      res.status(500).json({ error: "DB error" });
    }
  });

  // Groups list (pagination)
  app.get("/admin/groups-list", adminAuth, async (req: Request, res: Response) => {
    const limit = clampNumber(req.query.limit, 100, 1, 200);
    const offset = clampNumber(req.query.offset, 0, 0, 100000);

    try {
      const [{ rows: groups }, { rows: [totalRow] }] = await Promise.all([
        query(
          `
          select
            g.id,
            g.name,
            g.owner_id,
            g.created_at,
            g.updated_at,
            p.name as owner_name,
            cnt.member_count,
            msg.message_count,
            msg.last_message_at
          from public.groups g
          left join public.players p on p.id = g.owner_id
          left join lateral (
            select count(*)::int as member_count
            from public.group_members gm
            where gm.group_id = g.id
          ) cnt on true
          left join lateral (
            select count(*)::int as message_count,
              max(created_at) as last_message_at
            from public.group_messages gm2
            where gm2.group_id = g.id
          ) msg on true
          order by cnt.member_count desc nulls last, g.updated_at desc nulls last
          limit $1 offset $2
          `,
          [limit, offset],
        ),
        query(
          `
          select count(*)::int as total
          from public.groups
          `,
        ),
      ]);

      res.json({
        groups: groups ?? [],
        total: Number(totalRow?.total ?? 0),
        limit,
        offset,
      });
    } catch (err) {
      console.error("[admin] groups-list error:", err);
      res.status(500).json({ error: "DB error" });
    }
  });
}
