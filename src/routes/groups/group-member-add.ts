import type { Application, Request, Response } from "express";
import { query } from "../../db";
import { getIp } from "../../lib/ip";
import { checkRateLimit } from "../../lib/rateLimit";
import { areFriends, normalizeId } from "../messages/common";
import {
  GROUP_MAX_MEMBERS,
  canManageMembers,
  getGroupAccess,
  getGroupMemberCount,
  getPlayerInfo,
  parseGroupId,
  pushGroupEvent,
  recordGroupActivity,
} from "./common";
import { requireApiKey } from "../../middleware/auth";

export function registerGroupMemberAddRoute(app: Application): void {
  app.post("/groups/:groupId/members", requireApiKey, async (req: Request, res: Response) => {
    const ip = getIp(req);
    const groupId = parseGroupId(req.params.groupId);
    const body: any = req.body ?? {};
    const playerId = req.authenticatedPlayerId!;
    const memberId = normalizeId(body.memberId);

    if (!groupId) {
      return res.status(400).send("Invalid groupId");
    }

    if (!playerId || playerId.length < 3) {
      return res.status(400).send("Invalid playerId");
    }

    if (!memberId || memberId.length < 3) {
      return res.status(400).send("Invalid memberId");
    }

    if (playerId === memberId) {
      return res.status(400).send("Cannot add yourself");
    }

    try {
      const allowed = await checkRateLimit(ip, playerId, 120, 60);
      if (!allowed) {
        return res.status(429).send("Too many requests");
      }
    } catch (err) {
      console.error("group add member rate limit error:", err);
      return res.status(500).send("Rate limiter error");
    }

    let access = null;
    try {
      access = await getGroupAccess(groupId, playerId);
    } catch (err) {
      console.error("group add member access error:", err);
      return res.status(500).send("DB error");
    }

    if (!access) {
      return res.status(404).send("Group not found");
    }

    if (!canManageMembers(access.role)) {
      return res.status(403).send("Only owner or admin can invite members");
    }

    try {
      const { rows: existing } = await query<{ player_id: string }>(
        `
        select player_id
        from public.group_members
        where group_id = $1
          and player_id = $2
        limit 1
        `,
        [groupId, memberId],
      );

      if (existing[0]) {
        return res.status(409).send("Player already in group");
      }
    } catch (err) {
      console.error("group add member check error:", err);
      return res.status(500).send("DB error (member check)");
    }

    if (!access.isPublic) {
      try {
        const friends = await areFriends(playerId, memberId);
        if (!friends) {
          return res.status(403).send("Player is not your friend");
        }
      } catch (err) {
        console.error("group add member friend check error:", err);
        return res.status(500).send("DB error (friend check)");
      }
    }

    try {
      const { rows: players } = await query<{ id: string }>(
        `
        select id
        from public.players
        where id = $1
        limit 1
        `,
        [memberId],
      );
      if (!players[0]) {
        return res.status(404).send("Member not found");
      }
    } catch (err) {
      console.error("group add member player check error:", err);
      return res.status(500).send("DB error (player check)");
    }

    try {
      const count = await getGroupMemberCount(groupId);
      if (count >= GROUP_MAX_MEMBERS) {
        return res.status(409).send("Group is full");
      }
    } catch (err) {
      console.error("group add member count error:", err);
      return res.status(500).send("DB error (member count)");
    }

    const now = new Date().toISOString();

    try {
      await query(
        `
        insert into public.group_members (group_id, player_id, role, joined_at)
        values ($1,$2,'member',$3)
        `,
        [groupId, memberId, now],
      );

      await recordGroupActivity({
        groupId,
        groupName: access.name,
        type: "group_member_added",
        actorId: playerId,
        memberId,
        createdAt: now,
      });

      const memberInfo = await getPlayerInfo(memberId);
      await pushGroupEvent(groupId, "group_member_added", {
        groupId,
        groupName: access.name,
        member: memberInfo,
        addedBy: playerId,
        createdAt: now,
      });

      return res.status(204).send();
    } catch (err) {
      console.error("group add member error:", err);
      return res.status(500).send("DB error (add member)");
    }
  });
}
