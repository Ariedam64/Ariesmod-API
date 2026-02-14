import type { Application, Request, Response } from "express";
import { query } from "../../db";
import { getIp } from "../../lib/ip";
import { checkRateLimit } from "../../lib/rateLimit";
import { normalizeId } from "../messages/common";

export function registerLeaderboardCoinsRankRoute(app: Application): void {
  app.get("/leaderboard/coins/rank", async (req: Request, res: Response) => {
    const ip = getIp(req);
    const playerId = normalizeId(req.query.playerId);

    if (!playerId || playerId.length < 3) {
      return res.status(400).send("Invalid playerId");
    }

    try {
      const allowed = await checkRateLimit(ip, playerId, 300, 120);
      if (!allowed) {
        return res.status(429).send("Too many requests");
      }
    } catch (err) {
      console.error("leaderboard coins rank rate limit error:", err);
      return res.status(500).send("Rate limiter error");
    }

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
        rank: string | number;
        total: string | number;
      }>(
        `
        with ranked as (
          select
            ls.player_id,
            p.name,
            p.avatar_url,
            p.avatar,
            ls.coins,
            ls.eggs_hatched,
            p.last_event_at,
            pr.show_coins,
            row_number() over (
              order by ls.coins desc, p.created_at desc
            ) as rank,
            count(*) over () as total
          from public.leaderboard_stats ls
          join public.players p on p.id = ls.player_id
          left join public.player_privacy pr
            on pr.player_id = p.id
        )
        select *
        from ranked
        where player_id = $1
        limit 1
        `,
        [playerId],
      );

      const row = rows[0];
      if (!row) {
        return res.status(404).send("Player not found in leaderboard");
      }

      const anonymized = row.show_coins === false;

      return res.status(200).json({
        rank: Number(row.rank ?? 0),
        total: Number(row.total ?? 0),
        row: {
          ...(anonymized
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
        },
      });
    } catch (err) {
      console.error("leaderboard coins rank db error:", err);
      return res.status(500).send("DB error");
    }
  });
}
