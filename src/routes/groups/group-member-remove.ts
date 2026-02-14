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

export function registerGroupMemberRemoveRoute(app: Application): void {
  app.delete(
    "/groups/:groupId/members/:memberId",
    requireApiKey,
    async (req: Request, res: Response) => {
      const ip = getIp(req);
      const groupId = parseGroupId(req.params.groupId);
      const memberId = normalizeId(req.params.memberId);
      const body: any = req.body ?? {};
      const playerId = req.authenticatedPlayerId!;

      if (!groupId) {
        return res.status(400).send("Invalid groupId");
      }

      if (!playerId || playerId.length < 3) {
        return res.status(400).send("Invalid playerId");
      }

      if (!memberId || memberId.length < 3) {
        return res.status(400).send("Invalid memberId");
      }

      try {
        const allowed = await checkRateLimit(ip, playerId, 120, 60);
        if (!allowed) {
          return res.status(429).send("Too many requests");
        }
      } catch (err) {
        console.error("group remove member rate limit error:", err);
        return res.status(500).send("Rate limiter error");
      }

      let access = null;
      try {
        access = await getGroupAccess(groupId, playerId);
      } catch (err) {
        console.error("group remove member access error:", err);
        return res.status(500).send("DB error");
      }

      if (!access) {
        return res.status(404).send("Group not found");
      }

      if (access.ownerId !== playerId) {
        return res.status(403).send("Only owner can remove members");
      }

      if (memberId === access.ownerId) {
        return res.status(409).send("Owner cannot be removed");
      }

      try {
        const { rows } = await query<{ player_id: string }>(
          `
          select player_id
          from public.group_members
          where group_id = $1
            and player_id = $2
          limit 1
          `,
          [groupId, memberId],
        );
        if (!rows[0]) {
          return res.status(404).send("Member not found");
        }
      } catch (err) {
        console.error("group remove member check error:", err);
        return res.status(500).send("DB error (member check)");
      }

      const now = new Date().toISOString();

      try {
      await query(
        `
        delete from public.group_members
        where group_id = $1
          and player_id = $2
        `,
        [groupId, memberId],
      );

      await recordGroupActivity({
        groupId,
        groupName: access.name,
        type: "group_member_removed",
        actorId: playerId,
        memberId,
        createdAt: now,
      });

      await pushGroupEvent(groupId, "group_member_removed", {
        groupId,
        memberId,
          removedBy: playerId,
          removedAt: now,
        }, [memberId]);

        return res.status(204).send();
      } catch (err) {
        console.error("group remove member error:", err);
        return res.status(500).send("DB error (remove member)");
      }
    },
  );
}
