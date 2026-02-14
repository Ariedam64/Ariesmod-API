import type { Application, Request, Response } from "express";
import { query } from "../../db";
import { getIp } from "../../lib/ip";
import { checkRateLimit } from "../../lib/rateLimit";

function parseLimitOffset(req: Request): { limit: number; offset: number } {
  const limitRaw = Number(req.query.limit);
  const offsetRaw = Number(req.query.offset);
  const limit = Number.isFinite(limitRaw)
    ? Math.min(100, Math.max(1, Math.floor(limitRaw)))
    : 50;
  const offset = Number.isFinite(offsetRaw)
    ? Math.max(0, Math.floor(offsetRaw))
    : 0;
  return { limit, offset };
}

export function registerLeaderboardCoinsRoute(app: Application): void {
  app.get("/leaderboard/coins", async (req: Request, res: Response) => {
    const ip = getIp(req);

    try {
      const allowed = await checkRateLimit(ip, null, 300, 0);
      if (!allowed) {
        return res.status(429).send("Too many requests");
      }
    } catch (err) {
      console.error("leaderboard coins rate limit error:", err);
      return res.status(500).send("Rate limiter error");
    }

    const { limit, offset } = parseLimitOffset(req);

    try {
        const { rows } = await query<{
          player_id: string;
          name: string | null;
          avatar_url: string | null;
          avatar: unknown;
          coins: string | number;
          eggs_hatched: string | number;
          last_event_at: string | null;
          show_coins: boolean | null;
        }>(
          `
          select
            ls.player_id,
            p.name,
            p.avatar_url,
            p.avatar,
            ls.coins,
            ls.eggs_hatched,
            p.last_event_at,
            pr.show_coins
          from public.leaderboard_stats ls
          join public.players p on p.id = ls.player_id
          left join public.player_privacy pr
            on pr.player_id = p.id
          order by ls.coins desc, p.created_at desc
          limit $1 offset $2
          `,
          [limit, offset],
        );

      const rowsOut = (rows ?? []).map((row) => ({
        ...(row.show_coins === false
          ? {
              playerId: "null",
              playerName: "anonymous",
              avatarUrl: null,
              avatar: null,
              lastEventAt: null,
            }
          : {
              playerId: row.player_id,
              playerName: row.name ?? row.player_id,
              avatarUrl: row.avatar_url ?? null,
              avatar: row.avatar ?? null,
              lastEventAt: row.last_event_at ?? null,
            }),
        coins: Number(row.coins ?? 0),
        eggsHatched: Number(row.eggs_hatched ?? 0),
      }));

      return res.status(200).json({ rows: rowsOut });
    } catch (err) {
      console.error("leaderboard coins db error:", err);
      return res.status(500).send("DB error");
    }
  });
}
