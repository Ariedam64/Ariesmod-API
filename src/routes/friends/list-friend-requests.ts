import type { Application, Request, Response } from "express";
import { query } from "../../db";
import { getIp } from "../../lib/ip";
import { checkRateLimit } from "../../lib/rateLimit";

export function registerListFriendRequestsRoute(app: Application): void {
  
  app.get(
    "/list-friend-requests",
    async (req: Request, res: Response) => {
      const ip = getIp(req);
      const playerId = String(req.query.playerId ?? "").trim();

      if (!playerId || playerId.length < 3) {
        return res.status(400).send("Invalid playerId");
      }

      try {
        const allowed = await checkRateLimit(ip, playerId);
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
      };

      let rows: RelRow[] = [];

      try {
        const result = await query<RelRow>(
          `
          select user_one_id, user_two_id, requested_by, status, created_at
          from public.player_relationships
          where status = 'pending'
            and (user_one_id = $1 or user_two_id = $1)
          order by created_at desc
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
        createdAt: string;
      }[] = [];
      const outgoing: {
        toPlayerId: string;
        otherPlayerId: string;
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
            createdAt: rel.created_at,
          });
        } else {
          incoming.push({
            fromPlayerId: rel.requested_by,
            otherPlayerId: rel.requested_by,
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