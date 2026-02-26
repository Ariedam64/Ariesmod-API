import type { Application, Request, Response } from "express";
import { query } from "../../db";
import { getIp } from "../../lib/ip";
import { checkRateLimit } from "../../lib/rateLimit";
import { requireApiKey } from "../../middleware/auth";

export function registerListFriendRequestsRoute(app: Application): void {

  app.get(
    "/list-friend-requests",
    requireApiKey,
    async (req: Request, res: Response) => {
      const ip = getIp(req);
      const playerId = req.authenticatedPlayerId!;

      try {
        const allowed = await checkRateLimit(ip, playerId, 400, 240);
        if (!allowed) {
          return res.status(429).send("Too many requests");
        }
      } catch (err) {
        console.error("list-friend-requests rate limit error:", err);
        return res.status(500).send("Rate limiter error");
      }

      type RelRow = {
        user_one_id: string;
        user_two_id: string;
        requested_by: string;
        status: string;
        created_at: string;
        other_name: string | null;
        other_avatar_url: string | null;
        other_badges: string[] | null;
      };

      let rows: RelRow[] = [];

      try {
        const result = await query<RelRow>(
          `
          select
            pr.user_one_id,
            pr.user_two_id,
            pr.requested_by,
            pr.status,
            pr.created_at,
            p.name as other_name,
            p.avatar_url as other_avatar_url,
            p.badges as other_badges
          from public.player_relationships pr
          join public.players p
            on p.id = case
              when pr.user_one_id = $1 then pr.user_two_id
              else pr.user_one_id
            end
          where pr.status = 'pending'
            and (pr.user_one_id = $1 or pr.user_two_id = $1)
          order by pr.created_at desc
          `,
          [playerId],
        );
        rows = result.rows ?? [];
      } catch (err) {
        console.error("list-friend-requests db error:", err);
        return res.status(500).send("DB error");
      }

      const incoming: {
        fromPlayerId: string;
        otherPlayerId: string;
        playerName: string;
        avatarUrl: string | null;
        badges: string[];
        createdAt: string;
      }[] = [];
      const outgoing: {
        toPlayerId: string;
        otherPlayerId: string;
        playerName: string;
        avatarUrl: string | null;
        badges: string[];
        createdAt: string;
      }[] = [];

      for (const rel of rows) {
        const otherId =
          rel.user_one_id === playerId
            ? rel.user_two_id
            : rel.user_one_id;

        if (rel.requested_by === playerId) {
          outgoing.push({
            toPlayerId: otherId,
            otherPlayerId: otherId,
            playerName: rel.other_name ?? otherId,
            avatarUrl: rel.other_avatar_url ?? null,
            badges: rel.other_badges ?? [],
            createdAt: rel.created_at,
          });
        } else {
          incoming.push({
            fromPlayerId: rel.requested_by,
            otherPlayerId: rel.requested_by,
            playerName: rel.other_name ?? rel.requested_by,
            avatarUrl: rel.other_avatar_url ?? null,
            badges: rel.other_badges ?? [],
            createdAt: rel.created_at,
          });
        }
      }

      return res.status(200).json({
        playerId,
        incoming,
        outgoing,
      });
    },
  );
}