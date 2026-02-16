import type { Application, Request, Response } from "express";
import { query } from "../../db";
import { getIp } from "../../lib/ip";
import { checkRateLimit } from "../../lib/rateLimit";
import { CONNECTED_TTL_MS } from "../messages/common";

export function registerListModPlayersRoute(app: Application): void {
  app.get("/list-mod-players", async (req: Request, res: Response) => {
    const ip = getIp(req);
    const rawQuery = String(req.query.query ?? "").trim();

    let limit = Number(req.query.limit ?? 50);
    if (!Number.isFinite(limit) || limit <= 0) limit = 50;
    if (limit > 200) limit = 200;

    let offset = Number(req.query.offset ?? 0);
    if (!Number.isFinite(offset) || offset < 0) offset = 0;
    if (offset > 100000) offset = 100000;

    try {
      const allowed = await checkRateLimit(ip, null, 300, 120);
      if (!allowed) {
        return res.status(429).send("Too many requests");
      }
    } catch (err) {
      console.error("list-mod-players rate limit error:", err);
      return res.status(500).send("Rate limiter error");
    }

    const params: any[] = [];
    let idx = 1;
    let where = `
      where has_mod_installed = true
    `;

    if (rawQuery.length > 0) {
      const likeQuery = `%${rawQuery}%`;
      params.push(likeQuery);
      params.push(likeQuery);
      where += ` and (name ilike $${idx++} or id ilike $${idx++})`;
    }

    params.push(limit);
    params.push(offset);

    try {
      const { rows } = await query(
        `
        select
          id,
          name,
          avatar_url,
          avatar,
          last_event_at
        from public.players
        ${where}
        order by last_event_at desc nulls last, id asc
        limit $${idx++} offset $${idx++}
        `,
        params,
      );

      const now = Date.now();
      const result = (rows ?? []).map((row: any) => {
        const lastEventTs = row.last_event_at
          ? Date.parse(row.last_event_at)
          : null;
        const isOnline =
          lastEventTs !== null && now - lastEventTs <= CONNECTED_TTL_MS;

        return {
          playerId: row.id,
          playerName: row.name ?? row.id,
          avatarUrl: row.avatar_url ?? null,
          avatar: row.avatar ?? null,
          lastEventAt: row.last_event_at ?? null,
          isOnline,
        };
      });

      return res.status(200).json(result);
    } catch (err) {
      console.error("list-mod-players db error:", err);
      return res.status(500).send("DB error");
    }
  });
}
