import type { Application, Request, Response } from "express";
import { query } from "../../db";
import { getIp } from "../../lib/ip";
import { checkRateLimit } from "../../lib/rateLimit";
import { normalizeId } from "../messages/common";
import { getGroupAccess, parseGroupId } from "./common";
import { requireApiKey } from "../../middleware/auth";

export function registerGroupMessageListRoute(app: Application): void {
  app.get(
    "/groups/:groupId/messages",
    requireApiKey,
    async (req: Request, res: Response) => {
      const ip = getIp(req);
      const groupId = parseGroupId(req.params.groupId);
      const playerId = req.authenticatedPlayerId!;
      const afterIdRaw = normalizeId(req.query.afterId);
      const beforeIdRaw = normalizeId(req.query.beforeId);
      const limitRaw = normalizeId(req.query.limit);

      if (!groupId) {
        return res.status(400).send("Invalid groupId");
      }

      if (!playerId || playerId.length < 3) {
        return res.status(400).send("Invalid playerId");
      }

      try {
        const allowed = await checkRateLimit(ip, playerId, 240, 120);
        if (!allowed) {
          return res.status(429).send("Too many requests");
        }
      } catch (err) {
        console.error("group messages list rate limit error:", err);
        return res.status(500).send("Rate limiter error");
      }

      let access = null;
      try {
        access = await getGroupAccess(groupId, playerId);
      } catch (err) {
        console.error("group messages list access error:", err);
        return res.status(500).send("DB error");
      }

      if (!access) {
        return res.status(404).send("Group not found");
      }

      if (!access.role) {
        return res.status(403).send("Not a group member");
      }

      const afterId = Number(afterIdRaw);
      const beforeId = Number(beforeIdRaw);
      const limitCandidate = Number(limitRaw);
      const limit = Number.isFinite(limitCandidate)
        ? Math.min(100, Math.max(1, Math.floor(limitCandidate)))
        : 50;

      try {
        const params: any[] = [groupId];
        const conditions: string[] = ["group_id = $1"];
        let idx = 2;

        if (Number.isFinite(afterId) && afterId > 0) {
          conditions.push(`id > $${idx++}`);
          params.push(Math.floor(afterId));
        }

        if (Number.isFinite(beforeId) && beforeId > 0) {
          conditions.push(`id < $${idx++}`);
          params.push(Math.floor(beforeId));
        }

        const { rows } = await query<{
          id: number;
          sender_id: string;
          body: string;
          created_at: string;
        }>(
          `
          select id, sender_id, body, created_at
          from public.group_messages
          where ${conditions.join(" and ")}
          order by id asc
          limit $${idx}
          `,
          [...params, limit],
        );

        const messages = (rows ?? []).map((row) => ({
          id: row.id,
          groupId,
          senderId: row.sender_id,
          body: row.body,
          createdAt: row.created_at,
        }));

        return res.status(200).json(messages);
      } catch (err) {
        console.error("group messages list error:", err);
        return res.status(500).send("DB error (messages list)");
      }
    },
  );
}
