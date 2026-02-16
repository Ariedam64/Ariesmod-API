import type { Application, Request, Response } from "express";
import { getIp } from "../../lib/ip";
import { checkRateLimit } from "../../lib/rateLimit";
import { normalizeId } from "../messages/common";
import { getGroupAccess, getGroupMembersDetailed, parseGroupId } from "./common";
import { requireApiKey } from "../../middleware/auth";

export function registerGroupDetailRoute(app: Application): void {
  app.get("/groups/:groupId", requireApiKey, async (req: Request, res: Response) => {
    const ip = getIp(req);
    const groupId = parseGroupId(req.params.groupId);
    const playerId = req.authenticatedPlayerId!;

    if (!groupId) {
      return res.status(400).send("Invalid groupId");
    }

    if (!playerId || playerId.length < 3) {
      return res.status(400).send("Invalid playerId");
    }

    try {
      const allowed = await checkRateLimit(ip, playerId, 300, 120);
      if (!allowed) {
        return res.status(429).send("Too many requests");
      }
    } catch (err) {
      console.error("group detail rate limit error:", err);
      return res.status(500).send("Rate limiter error");
    }

    let access = null;
    try {
      access = await getGroupAccess(groupId, playerId);
    } catch (err) {
      console.error("group detail access error:", err);
      return res.status(500).send("DB error");
    }

    if (!access) {
      return res.status(404).send("Group not found");
    }

    // Allow non-members to view public groups
    if (!access.role && !access.isPublic) {
      return res.status(403).send("Not a group member");
    }

    try {
      const members = await getGroupMembersDetailed(groupId);
      return res.status(200).json({
        group: {
          id: access.groupId,
          name: access.name,
          ownerId: access.ownerId,
          isPublic: access.isPublic,
          createdAt: access.createdAt,
          updatedAt: access.updatedAt,
        },
        members,
        isMember: access.role !== null,
        role: access.role,
      });
    } catch (err) {
      console.error("group detail members error:", err);
      return res.status(500).send("DB error (members)");
    }
  });
}
