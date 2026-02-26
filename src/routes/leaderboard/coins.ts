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
    const rawQuery = String(req.query.query ?? "").trim();
    const myPlayerId = req.query.myPlayerId ? String(req.query.myPlayerId).trim() : null;

    const params: any[] = [];
    let idx = 1;
    let where = "";

    where = `where ls.coins > 0`;
    if (rawQuery.length > 0) {
      const likeQuery = `%${rawQuery}%`;
      params.push(likeQuery, likeQuery);
      where += ` and (p.name ilike $${idx++} or ls.player_id ilike $${idx++})`;
    }

    params.push(limit, offset);

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
            ls.coins_rank as rank
          from public.leaderboard_stats ls
          join public.players p on p.id = ls.player_id
          left join public.player_privacy pr
            on pr.player_id = p.id
          ${where}
          order by ls.coins_rank
          limit $${idx++} offset $${idx++}
          `,
          params,
        );

      const rowsOut = (rows ?? []).map((row) => {
        const currentRank = Number(row.rank ?? 0);
        const rankChange = row.coins_rank_snapshot_24h != null
          ? row.coins_rank_snapshot_24h - currentRank
          : null;
        const hidden = row.show_coins === false;

        return {
          ...(hidden
            ? {
                playerId: "null",
                playerName: "anonymous",
                avatarUrl: null,
                avatar: null,
                badges: [] as string[],
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
          rank: currentRank,
          total: Number(row.coins ?? 0),
          rankChange,
        };
      });

      // Fetch myRank if requested
      let myRank = null;
      if (myPlayerId) {
        const { rows: myRows } = await query<{
          player_id: string;
          name: string | null;
          avatar_url: string | null;
          avatar: unknown;
          badges: string[] | null;
          coins: string | number;
          last_event_at: string | null;
          show_coins: boolean | null;
          rank: string | number;
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
            ls.coins_rank as rank
          from public.leaderboard_stats ls
          join public.players p on p.id = ls.player_id
          left join public.player_privacy pr
            on pr.player_id = p.id
          where ls.player_id = $1
          `,
          [myPlayerId],
        );

        if (myRows && myRows.length > 0) {
          const row = myRows[0];
          const currentRank = Number(row.rank ?? 0);
          const rankChange = row.coins_rank_snapshot_24h != null
            ? row.coins_rank_snapshot_24h - currentRank
            : null;
          const hidden = row.show_coins === false;

          myRank = {
            ...(hidden
              ? {
                  playerId: "null",
                  playerName: "anonymous",
                  avatarUrl: null,
                  avatar: null,
                  badges: [] as string[],
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
            rank: currentRank,
            total: Number(row.coins ?? 0),
            rankChange,
          };
        }
      }

      return res.status(200).json({ rows: rowsOut, myRank });
    } catch (err) {
      console.error("leaderboard coins db error:", err);
      return res.status(500).send("DB error");
    }
  });
}
