import type { Application, Request, Response } from "express";
import { query } from "../../db";
import { getIp } from "../../lib/ip";
import { checkRateLimit } from "../../lib/rateLimit";
import { isPlayerConnected } from "../messages/common";

export function registerListFriendsRoute(app: Application): void {

  app.get("/list-friends", async (req: Request, res: Response) => {
    const ip = getIp(req);
    const playerId = String(req.query.playerId ?? "").trim();

    if (!playerId || playerId.length < 3) {
      return res.status(400).send("Invalid playerId");
    }

    try {
      const allowed = await checkRateLimit(ip, playerId, 300, 120);
      if (!allowed) {
        return res.status(429).send("Too many requests");
      }
    } catch (err) {
      console.error("list-friends rate limit error:", err);
      return res.status(500).send("Rate limiter error");
    }

    try {
      const connected = await isPlayerConnected(playerId);
      if (!connected) {
        return res.status(403).send("Player not connected");
      }
    } catch (err) {
      console.error("list-friends connected check error:", err);
      return res.status(500).send("DB error (connected check)");
    }

    try {
      const { rows } = await query<{
        id: string;
        name: string | null;
        avatar_url: string | null;
        avatar: unknown;
        last_event_at: string | null;
        room_id: string | null;
        is_private: boolean | null;
      }>(
        `
        select
          p.id,
          p.name,
          p.avatar_url,
          p.avatar,
          p.last_event_at,
          rp.room_id,
          r2.is_private
        from public.player_relationships r
        join public.players p
          on p.id = case
            when r.user_one_id = $1 then r.user_two_id
            else r.user_one_id
          end
        left join public.room_players rp
          on rp.player_id = p.id
          and rp.left_at is null
        left join public.rooms r2
          on r2.id = rp.room_id
        where r.status = 'accepted'
          and (r.user_one_id = $1 or r.user_two_id = $1)
        `,
        [playerId],
      );

      const friends = (rows ?? []).map((row) => ({
        playerId: row.id,
        name: row.name ?? row.id,
        avatarUrl: row.avatar_url ?? null,
        avatar: row.avatar ?? null,
        lastEventAt: row.last_event_at ?? null,
        roomId: row.room_id && !row.is_private ? row.room_id : null,
      }));

      return res.status(200).json({ playerId, friends });
    } catch (err) {
      console.error("list-friends db error:", err);
      return res.status(500).send("DB error");
    }
  });
}
