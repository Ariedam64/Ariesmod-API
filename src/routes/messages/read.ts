import type { Application, Request, Response } from "express";
import { query } from "../../db";
import { getIp } from "../../lib/ip";
import { checkRateLimit } from "../../lib/rateLimit";
import {
  areFriends,
  buildConversationId,
  isPlayerConnected,
  normalizeId,
} from "./common";
import { pushEvent } from "./streamHub";

export function registerMessagesReadRoute(app: Application): void {
  app.post("/messages/read", async (req: Request, res: Response) => {
    const ip = getIp(req);
    const body: any = req.body ?? {};
    const playerId = normalizeId(body.playerId);
    const otherPlayerId = normalizeId(body.otherPlayerId);
    const upToIdRaw = body.upToId;
    const upToId = Number(upToIdRaw);

    if (
      !playerId ||
      !otherPlayerId ||
      playerId.length < 3 ||
      otherPlayerId.length < 3
    ) {
      return res.status(400).send("Invalid player ids");
    }

    if (playerId === otherPlayerId) {
      return res.status(400).send("Invalid self thread");
    }

    if (!Number.isFinite(upToId) || upToId <= 0) {
      return res.status(400).send("Invalid upToId");
    }

    try {
      const allowed = await checkRateLimit(ip, playerId, 240, 240);
      if (!allowed) {
        return res.status(429).send("Too many requests");
      }
    } catch (err) {
      console.error("messages read rate limit error:", err);
      return res.status(500).send("Rate limiter error");
    }

    try {
      const connected = await isPlayerConnected(playerId);
      if (!connected) {
        return res.status(403).send("Player not connected");
      }
    } catch (err) {
      console.error("messages read connected check error:", err);
      return res.status(500).send("DB error (connected check)");
    }

    try {
      const friends = await areFriends(playerId, otherPlayerId);
      if (!friends) {
        return res.status(403).send("Not friends");
      }
    } catch (err) {
      console.error("messages read friend check error:", err);
      return res.status(500).send("DB error (friend check)");
    }

    const conversationId = buildConversationId(playerId, otherPlayerId);
    const now = new Date().toISOString();

    try {
      const { rows } = await query<{ id: number }>(
        `
        update public.direct_messages
        set read_at = $1
        where conversation_id = $2
          and recipient_id = $3
          and id <= $4
          and read_at is null
        returning id
        `,
        [now, conversationId, playerId, upToId],
      );

      if (rows.length > 0) {
        const payload = {
          conversationId,
          readerId: playerId,
          upToId,
          readAt: now,
        };
        pushEvent(otherPlayerId, "read", payload);
        pushEvent(playerId, "read", payload);
      }

      return res.status(200).json({ updated: rows.length });
    } catch (err) {
      console.error("messages read update error:", err);
      return res.status(500).send("DB error (read update)");
    }
  });
}
