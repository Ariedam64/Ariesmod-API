import type { Application, Request, Response } from "express";
import { query } from "../../db";
import { getIp } from "../../lib/ip";
import { checkMessageRateLimit } from "../../lib/messageRateLimit";
import { MESSAGE_MAX_LENGTH, normalizeId, normalizeText } from "../messages/common";
import { getGroupAccess, parseGroupId, pushGroupEvent } from "./common";
import { requireApiKey } from "../../middleware/auth";

export function registerGroupMessageSendRoute(app: Application): void {
  app.post(
    "/groups/:groupId/messages",
    requireApiKey,
    async (req: Request, res: Response) => {
      const ip = getIp(req);
      const groupId = parseGroupId(req.params.groupId);
      const body: any = req.body ?? {};
      const playerId = req.authenticatedPlayerId!;
      const text = normalizeText(body.text);

      if (!groupId) {
        return res.status(400).send("Invalid groupId");
      }

      if (!playerId || playerId.length < 3) {
        return res.status(400).send("Invalid playerId");
      }

      if (!text || text.length === 0 || text.length > MESSAGE_MAX_LENGTH) {
        return res
          .status(400)
          .send(`Message must be 1-${MESSAGE_MAX_LENGTH} chars`);
      }

      try {
        const allowed = await checkMessageRateLimit(ip, playerId, 120, 30);
        if (!allowed) {
          return res.status(429).send("Too many messages");
        }
      } catch (err) {
        console.error("group message rate limit error:", err);
        return res.status(500).send("Rate limiter error");
      }

      let access = null;
      try {
        access = await getGroupAccess(groupId, playerId);
      } catch (err) {
        console.error("group message access error:", err);
        return res.status(500).send("DB error");
      }

      if (!access) {
        return res.status(404).send("Group not found");
      }

      if (!access.role) {
        return res.status(403).send("Not a group member");
      }

      const now = new Date().toISOString();

      try {
        const { rows } = await query<{ id: number; created_at: string }>(
          `
          insert into public.group_messages (
            group_id,
            sender_id,
            body,
            created_at
          )
          values ($1,$2,$3,$4)
          returning id, created_at
          `,
          [groupId, playerId, text, now],
        );

        const message = rows[0];
        if (!message) {
          return res.status(500).send("DB error (message insert)");
        }

        // Keep only the last 500 messages
        try {
          const { rows: cutoffRows } = await query<{ id: number }>(
            `
            select id
            from public.group_messages
            where group_id = $1
            order by id desc
            offset 500
            limit 1
            `,
            [groupId],
          );
          const cutoffId = cutoffRows[0]?.id;
          if (cutoffId) {
            await query(
              `
              delete from public.group_messages
              where group_id = $1
                and id < $2
              `,
              [groupId, cutoffId],
            );
          }
        } catch (err) {
          console.error("group message trim error:", err);
        }

        const payload = {
          groupId,
          message: {
            id: message.id,
            groupId,
            senderId: playerId,
            body: text,
            createdAt: message.created_at,
          },
        };

        await pushGroupEvent(groupId, "group_message", payload);

        return res.status(201).json(payload);
      } catch (err) {
        console.error("group message send error:", err);
        return res.status(500).send("DB error (message send)");
      }
    },
  );
}
