import type { Application, Request, Response } from "express";
import { query } from "../../db";
import { getIp } from "../../lib/ip";
import { checkRateLimit } from "../../lib/rateLimit";
import { normalizeId } from "../messages/common";
import {
  getGroupAccess,
  parseGroupId,
  pushGroupEvent,
  recordGroupActivity,
} from "./common";
import { requireApiKey } from "../../middleware/auth";

export function registerGroupDeleteRoute(app: Application): void {
  app.delete("/groups/:groupId", requireApiKey, async (req: Request, res: Response) => {
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

    try {
      const allowed = await checkRateLimit(ip, playerId, 60, 30);
      if (!allowed) {
        return res.status(429).send("Too many requests");
      }
    } catch (err) {
      console.error("group delete rate limit error:", err);
      return res.status(500).send("Rate limiter error");
    }

    let access = null;
    try {
      access = await getGroupAccess(groupId, playerId);
    } catch (err) {
      console.error("group delete access error:", err);
      return res.status(500).send("DB error");
    }

    if (!access) {
      return res.status(404).send("Group not found");
    }

    if (access.ownerId !== playerId) {
      return res.status(403).send("Only owner can delete the group");
    }

    const now = new Date().toISOString();

    try {
      await recordGroupActivity({
        groupId,
        groupName: access.name,
        type: "group_deleted",
        actorId: playerId,
        createdAt: now,
      });

      await pushGroupEvent(groupId, "group_deleted", {
        groupId,
        deletedBy: playerId,
        deletedAt: now,
      });

      await query(
        `
        delete from public.groups
        where id = $1
        `,
        [groupId],
      );

      return res.status(204).send();
    } catch (err) {
      console.error("group delete error:", err);
      return res.status(500).send("DB error (delete)");
    }
  });
}
