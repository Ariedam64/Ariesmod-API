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
import { requireApiKey } from "../../middleware/auth";

export function registerMessagesThreadRoute(app: Application): void {
  app.get("/messages/thread", requireApiKey, async (req: Request, res: Response) => {
    const ip = getIp(req);
    const playerId = req.authenticatedPlayerId!;
    const otherPlayerId = normalizeId(req.query.otherPlayerId);

    let limit = Number(req.query.limit ?? 50);
    if (!Number.isFinite(limit) || limit <= 0) limit = 50;
    if (limit > 200) limit = 200;

    const afterIdRaw = req.query.afterId;
    const hasAfterId =
      typeof afterIdRaw === "string" && afterIdRaw.trim().length > 0;
    const afterId = hasAfterId ? Number(afterIdRaw) : null;

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

    if (hasAfterId && (!Number.isFinite(afterId) || afterId <= 0)) {
      return res.status(400).send("Invalid afterId");
    }

    try {
      const allowed = await checkRateLimit(ip, playerId, 300, 480);
      if (!allowed) {
        return res.status(429).send("Too many requests");
      }
    } catch (err) {
      console.error("messages thread rate limit error:", err);
      return res.status(500).send("Rate limiter error");
    }

    try {
      const connected = await isPlayerConnected(playerId);
      if (!connected) {
        return res.status(403).send("Player not connected");
      }
    } catch (err) {
      console.error("messages thread connected check error:", err);
      return res.status(500).send("DB error (connected check)");
    }

    try {
      const friends = await areFriends(playerId, otherPlayerId);
      if (!friends) {
        return res.status(403).send("Not friends");
      }
    } catch (err) {
      console.error("messages thread friend check error:", err);
      return res.status(500).send("DB error (friend check)");
    }

    const conversationId = buildConversationId(playerId, otherPlayerId);

    try {
      if (afterId && Number.isFinite(afterId) && afterId > 0) {
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
          where conversation_id = $1
            and id > $2
          order by id asc
          limit $3
          `,
          [conversationId, afterId, limit],
        );
        return res.status(200).json(rows ?? []);
      }

      const { rows } = await query(
        `
        select *
        from (
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
          where conversation_id = $1
          order by id desc
          limit $2
        ) t
        order by id asc
        `,
        [conversationId, limit],
      );

      return res.status(200).json(rows ?? []);
    } catch (err) {
      console.error("messages thread query error:", err);
      return res.status(500).send("DB error (thread query)");
    }
  });
}
