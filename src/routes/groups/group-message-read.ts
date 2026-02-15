import type { Application, Request, Response } from "express";
import { query } from "../../db";
import { getIp } from "../../lib/ip";
import { checkRateLimit } from "../../lib/rateLimit";
import { getGroupAccess, getPlayerInfo, parseGroupId, pushGroupEvent } from "./common";
import { requireApiKey } from "../../middleware/auth";

export function registerGroupMessageReadRoute(app: Application): void {
  app.post(
    "/groups/:groupId/messages/read",
    requireApiKey,
    async (req: Request, res: Response) => {
      const ip = getIp(req);
      const groupId = parseGroupId(req.params.groupId);
      const body: any = req.body ?? {};
      const playerId = req.authenticatedPlayerId!;
      if (!groupId) {
        return res.status(400).send("Invalid groupId");
      }

      if (!playerId || playerId.length < 3) {
        return res.status(400).send("Invalid playerId");
      }

      const messageId = Number(body.messageId);
      if (!Number.isFinite(messageId) || messageId <= 0) {
        return res.status(400).send("Invalid messageId");
      }

      try {
        const allowed = await checkRateLimit(ip, playerId, 300, 120);
        if (!allowed) {
          return res.status(429).send("Too many requests");
        }
      } catch (err) {
        console.error("group message read rate limit error:", err);
        return res.status(500).send("Rate limiter error");
      }

      let access = null;
      try {
        access = await getGroupAccess(groupId, playerId);
      } catch (err) {
        console.error("group message read access error:", err);
        return res.status(500).send("DB error");
      }

      if (!access) {
        return res.status(404).send("Group not found");
      }

      if (!access.role) {
        return res.status(403).send("Not a group member");
      }

      try {
        // Verify the message exists in this group
        const { rows: msgRows } = await query<{ id: number }>(
          `
          select id
          from public.group_messages
          where id = $1
            and group_id = $2
          limit 1
          `,
          [messageId, groupId],
        );

        if (!msgRows[0]) {
          return res.status(404).send("Message not found");
        }

        // Update last_read_message_id for this member
        const { rowCount } = await query(
          `
          update public.group_members
          set last_read_message_id = $1
          where group_id = $2
            and player_id = $3
            and (last_read_message_id is null or last_read_message_id < $1)
          `,
          [messageId, groupId, playerId],
        );

        if (rowCount && rowCount > 0) {
          const readerInfo = await getPlayerInfo(playerId);
          await pushGroupEvent(groupId, "group_read", {
            groupId,
            readerId: playerId,
            reader: readerInfo,
            messageId,
            readAt: new Date().toISOString(),
          });
        }

        return res.status(204).send();
      } catch (err) {
        console.error("group message read error:", err);
        return res.status(500).send("DB error (mark read)");
      }
    },
  );
}
