import type { Application, Request, Response } from "express";
import { getIp } from "../../lib/ip";
import { checkRateLimit } from "../../lib/rateLimit";
import { normalizeId } from "../messages/common";
import {
  canManageMembers,
  getGroupAccess,
  getMemberRole,
  getPlayerInfo,
  isValidAssignableRole,
  outranks,
  parseGroupId,
  pushGroupEvent,
  recordGroupActivity,
} from "./common";
import { requireApiKey } from "../../middleware/auth";
import { query } from "../../db";

export function registerGroupRoleRoute(app: Application): void {
  app.patch(
    "/groups/:groupId/members/:memberId/role",
    requireApiKey,
    async (req: Request, res: Response) => {
      const ip = getIp(req);
      const groupId = parseGroupId(req.params.groupId);
      const memberId = normalizeId(req.params.memberId);
      const body: any = req.body ?? {};
      const playerId = req.authenticatedPlayerId!;
      const newRole = typeof body.role === "string" ? body.role.trim() : "";

      if (!groupId) {
        return res.status(400).send("Invalid groupId");
      }

      if (!playerId || playerId.length < 3) {
        return res.status(400).send("Invalid playerId");
      }

      if (!memberId || memberId.length < 3) {
        return res.status(400).send("Invalid memberId");
      }

      if (!isValidAssignableRole(newRole)) {
        return res.status(400).send("Invalid role (must be 'admin' or 'member')");
      }

      if (playerId === memberId) {
        return res.status(400).send("Cannot change your own role");
      }

      try {
        const allowed = await checkRateLimit(ip, playerId, 120, 60);
        if (!allowed) {
          return res.status(429).send("Too many requests");
        }
      } catch (err) {
        console.error("group role rate limit error:", err);
        return res.status(500).send("Rate limiter error");
      }

      let access = null;
      try {
        access = await getGroupAccess(groupId, playerId);
      } catch (err) {
        console.error("group role access error:", err);
        return res.status(500).send("DB error");
      }

      if (!access) {
        return res.status(404).send("Group not found");
      }

      if (!canManageMembers(access.role)) {
        return res.status(403).send("Only owner or admin can change roles");
      }

      let targetRole: string | null = null;
      try {
        targetRole = await getMemberRole(groupId, memberId);
        if (!targetRole) {
          return res.status(404).send("Member not found");
        }
      } catch (err) {
        console.error("group role member check error:", err);
        return res.status(500).send("DB error (member check)");
      }

      if (!outranks(access.role!, targetRole)) {
        return res.status(403).send("Cannot change role of a member with equal or higher role");
      }

      if (targetRole === newRole) {
        return res.status(409).send("Member already has this role");
      }

      const now = new Date().toISOString();

      try {
        await query(
          `
          update public.group_members
          set role = $1
          where group_id = $2
            and player_id = $3
          `,
          [newRole, groupId, memberId],
        );

        await recordGroupActivity({
          groupId,
          groupName: access.name,
          type: "group_role_changed",
          actorId: playerId,
          memberId,
          meta: { oldRole: targetRole, newRole },
          createdAt: now,
        });

        const memberInfo = await getPlayerInfo(memberId);
        await pushGroupEvent(groupId, "group_role_changed", {
          groupId,
          member: memberInfo,
          oldRole: targetRole,
          newRole,
          changedBy: playerId,
          changedAt: now,
        });

        return res.status(200).json({
          memberId,
          oldRole: targetRole,
          newRole,
        });
      } catch (err) {
        console.error("group role change error:", err);
        return res.status(500).send("DB error (role change)");
      }
    },
  );
}
