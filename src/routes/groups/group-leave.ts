import type { Application, Request, Response } from "express";
import { query } from "../../db";
import { getIp } from "../../lib/ip";
import { checkRateLimit } from "../../lib/rateLimit";
import { normalizeId } from "../messages/common";
import { getGroupAccess, parseGroupId, pushGroupEvent } from "./common";
import { requireApiKey } from "../../middleware/auth";

export function registerGroupLeaveRoute(app: Application): void {
  app.post("/groups/:groupId/leave", requireApiKey, async (req: Request, res: Response) => {
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
      const allowed = await checkRateLimit(ip, playerId, 120, 60);
      if (!allowed) {
        return res.status(429).send("Too many requests");
      }
    } catch (err) {
      console.error("group leave rate limit error:", err);
      return res.status(500).send("Rate limiter error");
    }

    let access = null;
    try {
      access = await getGroupAccess(groupId, playerId);
    } catch (err) {
      console.error("group leave access error:", err);
      return res.status(500).send("DB error");
    }

    if (!access) {
      return res.status(404).send("Group not found");
    }

    if (!access.role) {
      return res.status(403).send("Not a group member");
    }

    if (access.ownerId === playerId) {
      return res.status(409).send("Owner must delete the group");
    }

    const now = new Date().toISOString();

    try {
      await query(
        `
        delete from public.group_members
        where group_id = $1
          and player_id = $2
        `,
        [groupId, playerId],
      );

      await pushGroupEvent(
        groupId,
        "group_member_removed",
        {
          groupId,
          memberId: playerId,
          removedBy: playerId,
          removedAt: now,
        },
        [playerId],
      );

      return res.status(204).send();
    } catch (err) {
      console.error("group leave error:", err);
      return res.status(500).send("DB error (leave)");
    }
  });
}
