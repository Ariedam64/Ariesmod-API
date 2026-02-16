import type { Application, Request, Response } from "express";
import { query } from "../../db";
import { getIp } from "../../lib/ip";
import { checkRateLimit } from "../../lib/rateLimit";
import { normalizeId } from "../messages/common";

export function registerLeaderboardEggsRankRoute(app: Application): void {
  app.get(
    "/leaderboard/eggs-hatched/rank",
    async (req: Request, res: Response) => {
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
        console.error("leaderboard eggs rank rate limit error:", err);
        return res.status(500).send("Rate limiter error");
      }

      try {
        const { rows } = await query<{
          player_id: string;
          name: string | null;
          avatar_url: string | null;
          avatar: unknown;
          eggs_hatched: string | number;
          last_event_at: string | null;
          show_stats: boolean | null;
          rank: string | number;
          total: string | number;
          eggs_rank_snapshot_24h: number | null;
        }>(
          `
          select
            ls.player_id,
            p.name,
            p.avatar_url,
            p.avatar,
            ls.eggs_hatched,
            p.last_event_at,
            pr.show_stats,
            ls.eggs_rank_snapshot_24h,
            ls.eggs_rank as rank,
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

        const anonymized = row.show_stats === false;
        const currentRank = Number(row.rank ?? 0);
        const rankChange = row.eggs_rank_snapshot_24h != null
          ? row.eggs_rank_snapshot_24h - currentRank
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
                  lastEventAt: null,
                }
              : {
                  playerId: row.player_id,
                  playerName: row.name ?? row.player_id,
                  avatarUrl: row.avatar_url ?? null,
                  avatar: row.avatar ?? null,
                  lastEventAt: row.last_event_at ?? null,
                }),
            total: Number(row.eggs_hatched ?? 0),
          },
        });
      } catch (err) {
        console.error("leaderboard eggs rank db error:", err);
        return res.status(500).send("DB error");
      }
    },
  );
}
