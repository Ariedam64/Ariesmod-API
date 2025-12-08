import type { Application, Request, Response } from "express";
import { query } from "../../db";
import { getIp } from "../../lib/ip";
import { checkRateLimit } from "../../lib/rateLimit";

export function registerListFriendsRoute(app: Application): void {

  app.get("/list-friends", async (req: Request, res: Response) => {
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
      console.error("list-friends rate limit error:", err);
      return res.status(500).send("Rate limiter error");
    }

    let rows: { user_one_id: string; user_two_id: string }[] = [];

    try {
      const result = await query<{
        user_one_id: string;
        user_two_id: string;
      }>(
        `
        select user_one_id, user_two_id
        from public.player_relationships
        where status = 'accepted'
          and (user_one_id = $1 or user_two_id = $1)
        `,
        [playerId],
      );

      rows = result.rows ?? [];
    } catch (err) {
      console.error("list-friends db error:", err);
      return res.status(500).send("DB error");
    }

    const friends: string[] = [];

    for (const rel of rows) {
      if (rel.user_one_id === playerId) {
        friends.push(rel.user_two_id);
      } else if (rel.user_two_id === playerId) {
        friends.push(rel.user_one_id);
      }
    }

    const uniqueFriends = Array.from(new Set(friends));

    return res.status(200).json({
      playerId,
      friends: uniqueFriends,
    });
  });
}