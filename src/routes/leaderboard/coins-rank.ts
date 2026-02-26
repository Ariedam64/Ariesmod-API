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
        badges: string[] | null;
        coins: string | number;
        last_event_at: string | null;
        show_coins: boolean | null;
        rank: string | number;
        total: string | number;
        coins_rank_snapshot_24h: number | null;
      }>(
        `
        select
          ls.player_id,
          p.name,
          p.avatar_url,
          p.avatar,
          p.badges,
          ls.coins,
          p.last_event_at,
          pr.show_coins,
          ls.coins_rank_snapshot_24h,
          ls.coins_rank as rank,
          (select count(*) from public.leaderboard_stats) as total
        from public.leaderboard_stats ls
        join public.players p on p.id = ls.player_id
        left join public.player_privacy pr
          on pr.player_id = p.id
        where ls.player_id = $1
        limit 1
        `,
        [playerId],
      );

      const row = rows[0];
      if (!row) {
        return res.status(404).send("Player not found in leaderboard");
      }

      const anonymized = row.show_coins === false;
      const currentRank = Number(row.rank ?? 0);
      const rankChange = row.coins_rank_snapshot_24h != null
        ? row.coins_rank_snapshot_24h - currentRank
        : null;

      return res.status(200).json({
        rank: currentRank,
        total: Number(row.total ?? 0),
        rankChange,
        row: {
          ...(anonymized
            ? {
                playerId: "null",
                playerName: "anonymous",
                avatarUrl: null,
                avatar: null,
                badges: [],
                lastEventAt: null,
              }
            : {
                playerId: row.player_id,
                playerName: row.name ?? row.player_id,
                avatarUrl: row.avatar_url ?? null,
                avatar: row.avatar ?? null,
                badges: row.badges ?? [],
                lastEventAt: row.last_event_at ?? null,
              }),
          total: Number(row.coins ?? 0),
        },
      });
    } catch (err) {
      console.error("leaderboard coins rank db error:", err);
      return res.status(500).send("DB error");
    }
  });
}
