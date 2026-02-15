import type { Application, Request, Response } from "express";
import { query } from "../../db";
import { getIp } from "../../lib/ip";
import { checkRateLimit } from "../../lib/rateLimit";
import { normalizeId, normalizeText } from "../messages/common";
import {
  GROUP_NAME_MAX,
  canManageMembers,
  getGroupAccess,
  getPlayerInfo,
  parseGroupId,
  pushGroupEvent,
  recordGroupActivity,
} from "./common";
import { requireApiKey } from "../../middleware/auth";

export function registerGroupRenameRoute(app: Application): void {
  app.patch("/groups/:groupId", requireApiKey, async (req: Request, res: Response) => {
    const ip = getIp(req);
    const groupId = parseGroupId(req.params.groupId);
    const body: any = req.body ?? {};
    const playerId = req.authenticatedPlayerId!;
    const name = normalizeText(body.name);

    if (!groupId) {
      return res.status(400).send("Invalid groupId");
    }

    if (!playerId || playerId.length < 3) {
      return res.status(400).send("Invalid playerId");
    }

    if (!name || name.length === 0 || name.length > GROUP_NAME_MAX) {
      return res.status(400).send("Invalid group name");
    }

    try {
      const allowed = await checkRateLimit(ip, playerId, 120, 60);
      if (!allowed) {
        return res.status(429).send("Too many requests");
      }
    } catch (err) {
      console.error("group rename rate limit error:", err);
      return res.status(500).send("Rate limiter error");
    }

    let access = null;
    try {
      access = await getGroupAccess(groupId, playerId);
    } catch (err) {
      console.error("group rename access error:", err);
      return res.status(500).send("DB error");
    }

    if (!access) {
      return res.status(404).send("Group not found");
    }

    if (!canManageMembers(access.role)) {
      return res.status(403).send("Only owner or admin can rename the group");
    }

    const now = new Date().toISOString();

    try {
      await query(
        `
        update public.groups
        set name = $1,
            updated_at = $2
        where id = $3
        `,
        [name, now, groupId],
      );

      await recordGroupActivity({
        groupId,
        groupName: name,
        type: "group_renamed",
        actorId: playerId,
        createdAt: now,
        meta: { oldName: access.name },
      });

      const actorInfo = await getPlayerInfo(playerId);
      await pushGroupEvent(groupId, "group_updated", {
        groupId,
        name,
        actor: actorInfo,
        updatedAt: now,
      });

      return res.status(200).json({ groupId, name, updatedAt: now });
    } catch (err) {
      console.error("group rename error:", err);
      return res.status(500).send("DB error (rename)");
    }
  });
}
