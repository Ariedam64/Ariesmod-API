import type { Application, Request, Response } from "express";
import { query } from "../../db";
import { getIp } from "../../lib/ip";
import { checkMessageRateLimit } from "../../lib/messageRateLimit";
import {
  MESSAGE_MAX_LENGTH,
  areFriends,
  buildConversationId,
  isPlayerConnectedInRoom,
  normalizeId,
  normalizeText,
} from "./common";
import { pushEvent } from "./streamHub";

export function registerMessagesSendRoute(app: Application): void {
  app.post("/messages/send", async (req: Request, res: Response) => {
    const ip = getIp(req);
    const body: any = req.body ?? {};

    const fromPlayerId = normalizeId(body.fromPlayerId);
    const toPlayerId = normalizeId(body.toPlayerId);
    const roomId = normalizeId(body.roomId);
    const text = normalizeText(body.text);

    if (
      !fromPlayerId ||
      !toPlayerId ||
      fromPlayerId.length < 3 ||
      toPlayerId.length < 3
    ) {
      return res.status(400).send("Invalid player ids");
    }

    if (fromPlayerId === toPlayerId) {
      return res.status(400).send("Cannot message yourself");
    }

    if (!roomId) {
      return res.status(400).send("Invalid roomId");
    }

    if (!text || text.length === 0 || text.length > MESSAGE_MAX_LENGTH) {
      return res
        .status(400)
        .send(`Message must be 1-${MESSAGE_MAX_LENGTH} chars`);
    }

    try {
      const allowed = await checkMessageRateLimit(ip, fromPlayerId, 120, 30);
      if (!allowed) {
        return res.status(429).send("Too many messages");
      }
    } catch (err) {
      console.error("messages send rate limit error:", err);
      return res.status(500).send("Rate limiter error");
    }

    try {
      const friends = await areFriends(fromPlayerId, toPlayerId);
      if (!friends) {
        return res.status(403).send("Not friends");
      }
    } catch (err) {
      console.error("messages send friend check error:", err);
      return res.status(500).send("DB error (friend check)");
    }

    try {
      const connected = await isPlayerConnectedInRoom(fromPlayerId, roomId);
      if (!connected) {
        return res.status(403).send("Sender not connected in room");
      }
    } catch (err) {
      console.error("messages send connected check error:", err);
      return res.status(500).send("DB error (connected check)");
    }

    const conversationId = buildConversationId(fromPlayerId, toPlayerId);
    const now = new Date().toISOString();

    try {
      const { rows } = await query<{
        id: number;
        created_at: string;
        delivered_at: string;
      }>(
        `
        insert into public.direct_messages (
          conversation_id,
          sender_id,
          recipient_id,
          room_id,
          body,
          created_at,
          delivered_at
        )
        values ($1,$2,$3,$4,$5,$6,$6)
        returning id, created_at, delivered_at
        `,
        [
          conversationId,
          fromPlayerId,
          toPlayerId,
          roomId,
          text,
          now,
        ],
      );

      const message = rows[0];
      if (!message) {
        return res.status(500).send("DB error (message insert)");
      }

      const payload = {
        id: message.id,
        conversationId,
        senderId: fromPlayerId,
        recipientId: toPlayerId,
        body: text,
        createdAt: message.created_at,
        deliveredAt: message.delivered_at,
        readAt: null,
      };

      pushEvent(toPlayerId, "message", payload);
      pushEvent(fromPlayerId, "message", payload);

      return res.status(201).json(payload);
    } catch (err) {
      console.error("messages send insert error:", err);
      return res.status(500).send("DB error (message insert)");
    }
  });
}
