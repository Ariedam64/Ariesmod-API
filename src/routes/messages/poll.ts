import type { Application, Request, Response } from "express";
import { query } from "../../db";
import { getIp } from "../../lib/ip";
import { checkRateLimit } from "../../lib/rateLimit";
import { isPlayerConnected, normalizeId } from "./common";

export function registerMessagesPollRoute(app: Application): void {
  app.get("/messages/poll", async (req: Request, res: Response) => {
    const ip = getIp(req);
    const playerId = normalizeId(req.query.playerId);
    const sinceRaw = normalizeId(req.query.since);

    if (!playerId || playerId.length < 3) {
      return res.status(400).send("Invalid playerId");
    }

    if (!sinceRaw) {
      return res.status(400).send("Missing since");
    }

    const since = new Date(sinceRaw);
    if (isNaN(since.getTime())) {
      return res.status(400).send("Invalid since timestamp");
    }

    try {
      const allowed = await checkRateLimit(ip, playerId, 400, 960);
      if (!allowed) {
        return res.status(429).send("Too many requests");
      }
    } catch (err) {
      console.error("messages poll rate limit error:", err);
      return res.status(500).send("Rate limiter error");
    }

    try {
      const connected = await isPlayerConnected(playerId);
      if (!connected) {
        return res.status(403).send("Player not connected");
      }
    } catch (err) {
      console.error("messages poll connected check error:", err);
      return res.status(500).send("DB error (connected check)");
    }

    try {
      const { rows } = await query(
        `
        select
          id,
          conversation_id as "conversationId",
          sender_id as "senderId",
          recipient_id as "recipientId",
          body,
          created_at as "createdAt",
          delivered_at as "deliveredAt",
          read_at as "readAt"
        from public.direct_messages
        where (sender_id = $1 or recipient_id = $1)
          and created_at > $2
        order by id asc
        limit 100
        `,
        [playerId, since.toISOString()],
      );

      return res.status(200).json(rows ?? []);
    } catch (err) {
      console.error("messages poll query error:", err);
      return res.status(500).send("DB error (poll query)");
    }
  });
}
