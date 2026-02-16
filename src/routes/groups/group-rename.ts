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

    if (!groupId) {
      return res.status(400).send("Invalid groupId");
    }

    if (!playerId || playerId.length < 3) {
      return res.status(400).send("Invalid playerId");
    }

    // Extract and validate optional fields
    const updates: { name?: string; isPublic?: boolean } = {};

    if (body.name !== undefined) {
      const name = normalizeText(body.name);
      if (!name || name.length === 0 || name.length > GROUP_NAME_MAX) {
        return res.status(400).send("Invalid group name");
      }
      updates.name = name;
    }

    if (body.isPublic !== undefined) {
      if (typeof body.isPublic !== "boolean") {
        return res.status(400).send("isPublic must be a boolean");
      }
      updates.isPublic = body.isPublic;
    }

    // At least one field must be provided
    if (Object.keys(updates).length === 0) {
      return res.status(400).send("At least one field (name or isPublic) must be provided");
    }

    try {
      const allowed = await checkRateLimit(ip, playerId, 120, 60);
      if (!allowed) {
        return res.status(429).send("Too many requests");
      }
    } catch (err) {
      console.error("group update rate limit error:", err);
      return res.status(500).send("Rate limiter error");
    }

    let access = null;
    try {
      access = await getGroupAccess(groupId, playerId);
    } catch (err) {
      console.error("group update access error:", err);
      return res.status(500).send("DB error");
    }

    if (!access) {
      return res.status(404).send("Group not found");
    }

    if (!canManageMembers(access.role)) {
      return res.status(403).send("Only owner or admin can update the group");
    }

    const now = new Date().toISOString();

    try {
      // Build dynamic SQL update query
      const setClauses: string[] = ["updated_at = $1"];
      const params: any[] = [now];
      let paramIndex = 2;

      if (updates.name !== undefined) {
        setClauses.push(`name = $${paramIndex}`);
        params.push(updates.name);
        paramIndex++;
      }

      if (updates.isPublic !== undefined) {
        setClauses.push(`is_public = $${paramIndex}`);
        params.push(updates.isPublic);
        paramIndex++;
      }

      params.push(groupId);

      await query(
        `
        update public.groups
        set ${setClauses.join(", ")}
        where id = $${paramIndex}
        `,
        params,
      );

      // Record activity if name changed
      if (updates.name !== undefined) {
        await recordGroupActivity({
          groupId,
          groupName: updates.name,
          type: "group_renamed",
          actorId: playerId,
          createdAt: now,
          meta: { oldName: access.name },
        });
      }

      const actorInfo = await getPlayerInfo(playerId);
      const eventPayload: any = {
        groupId,
        actor: actorInfo,
        updatedAt: now,
      };

      if (updates.name !== undefined) {
        eventPayload.name = updates.name;
      }

      if (updates.isPublic !== undefined) {
        eventPayload.isPublic = updates.isPublic;
      }

      await pushGroupEvent(groupId, "group_updated", eventPayload);

      const response: any = { groupId, updatedAt: now };
      if (updates.name !== undefined) response.name = updates.name;
      if (updates.isPublic !== undefined) response.isPublic = updates.isPublic;

      return res.status(200).json(response);
    } catch (err) {
      console.error("group update error:", err);
      return res.status(500).send("DB error (update)");
    }
  });
}
