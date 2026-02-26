import type { Application, Request, Response } from "express";
import { query } from "../../db";
import { adminAuth, clampNumber } from "./common";

export function registerAdminLeaderboardRoutes(app: Application): void {
  app.get("/admin/leaderboard-view", adminAuth, async (req: Request, res: Response) => {
    const limit = clampNumber(req.query.limit, 50, 10, 200);

    try {
      const [{ rows: coins }, { rows: eggs }] = await Promise.all([
        query(
          `SELECT
            ls.coins_rank AS rank,
            ls.coins AS total,
            ls.coins_rank_snapshot_24h,
            p.id AS player_id,
            p.name AS player_name,
            p.avatar_url,
            p.last_event_at,
            pr.show_coins
          FROM public.leaderboard_stats ls
          JOIN public.players p ON p.id = ls.player_id
          LEFT JOIN public.player_privacy pr ON pr.player_id = p.id
          ORDER BY ls.coins_rank
          LIMIT $1`,
          [limit],
        ),
        query(
          `SELECT
            ls.eggs_rank AS rank,
            ls.eggs_hatched AS total,
            ls.eggs_rank_snapshot_24h,
            p.id AS player_id,
            p.name AS player_name,
            p.avatar_url,
            p.last_event_at,
            pr.show_stats
          FROM public.leaderboard_stats ls
          JOIN public.players p ON p.id = ls.player_id
          LEFT JOIN public.player_privacy pr ON pr.player_id = p.id
          ORDER BY ls.eggs_rank
          LIMIT $1`,
          [limit],
        ),
      ]);

      const mapRow = (row: any, privacyField: string) => {
        const currentRank = Number(row.rank ?? 0);
        const snapshot = row[privacyField === "show_coins" ? "coins_rank_snapshot_24h" : "eggs_rank_snapshot_24h"];
        const rankChange = snapshot != null ? snapshot - currentRank : null;
        const anon = row[privacyField] === false;
        return {
          rank: currentRank,
          total: Number(row.total ?? 0),
          rankChange,
          playerId: anon ? null : row.player_id,
          playerName: anon ? "anonymous" : (row.player_name ?? row.player_id),
          avatarUrl: anon ? null : (row.avatar_url ?? null),
          lastEventAt: anon ? null : (row.last_event_at ?? null),
          isAnon: anon,
        };
      };

      res.json({
        ts: new Date().toISOString(),
        coins: coins.map((r: any) => mapRow(r, "show_coins")),
        eggs: eggs.map((r: any) => mapRow(r, "show_stats")),
      });
    } catch (err) {
      console.error("[admin] leaderboard-view error:", err);
      res.status(500).json({ error: "DB error" });
    }
  });
}
