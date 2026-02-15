import type { Application, Request, Response } from "express";
import { getIp } from "../../lib/ip";
import { checkRateLimit } from "../../lib/rateLimit";
import { query } from "../../db";
import {
  GROUP_MAX_MEMBERS,
  getGroupAccess,
  getGroupMemberCount,
  getPlayerInfo,
  parseGroupId,
  pushGroupEvent,
  recordGroupActivity,
} from "./common";
import { requireApiKey } from "../../middleware/auth";

export function registerGroupJoinRoute(app: Application): void {
  app.post("/groups/:groupId/join", requireApiKey, async (req: Request, res: Response) => {
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
      const allowed = await checkRateLimit(ip, playerId, 120, 60);
      if (!allowed) {
        return res.status(429).send("Too many requests");
      }
    } catch (err) {
      console.error("group join rate limit error:", err);
      return res.status(500).send("Rate limiter error");
    }

    let access = null;
    try {
      access = await getGroupAccess(groupId, playerId);
    } catch (err) {
      console.error("group join access error:", err);
      return res.status(500).send("DB error");
    }

    if (!access) {
      return res.status(404).send("Group not found");
    }

    if (!access.isPublic) {
      return res.status(403).send("Group is not public");
    }

    if (access.role) {
      return res.status(409).send("Already a member");
    }

    try {
      const count = await getGroupMemberCount(groupId);
      if (count >= GROUP_MAX_MEMBERS) {
        return res.status(409).send("Group is full");
      }
    } catch (err) {
      console.error("group join count error:", err);
      return res.status(500).send("DB error (member count)");
    }

    const now = new Date().toISOString();

    try {
      await query(
        `
        insert into public.group_members (group_id, player_id, role, joined_at)
        values ($1,$2,'member',$3)
        `,
        [groupId, playerId, now],
      );

      await recordGroupActivity({
        groupId,
        groupName: access.name,
        type: "group_member_joined",
        actorId: playerId,
        memberId: playerId,
        createdAt: now,
      });

      const memberInfo = await getPlayerInfo(playerId);
      await pushGroupEvent(groupId, "group_member_added", {
        groupId,
        groupName: access.name,
        member: memberInfo,
        addedBy: playerId,
        createdAt: now,
      });

      return res.status(204).send();
    } catch (err) {
      console.error("group join error:", err);
      return res.status(500).send("DB error (join)");
    }
  });
}
