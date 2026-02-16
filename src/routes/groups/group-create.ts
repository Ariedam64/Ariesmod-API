import type { Application, Request, Response } from "express";
import { query } from "../../db";
import { getIp } from "../../lib/ip";
import { checkRateLimit } from "../../lib/rateLimit";
import { normalizeId, normalizeText } from "../messages/common";
import { GROUP_NAME_MAX, recordGroupActivity, getPlayerInfo } from "./common";
import { requireApiKey } from "../../middleware/auth";
import { pushUnifiedEvent } from "../events/hub";

export function registerGroupCreateRoute(app: Application): void {
  app.post("/groups", requireApiKey, async (req: Request, res: Response) => {
    const ip = getIp(req);
    const body: any = req.body ?? {};
    const ownerId = req.authenticatedPlayerId!;
    const name = normalizeText(body.name);
    const isPublic = body.isPublic === true;

    if (!ownerId || ownerId.length < 3) {
      return res.status(400).send("Invalid ownerId");
    }

    if (!name || name.length === 0 || name.length > GROUP_NAME_MAX) {
      return res.status(400).send("Invalid group name");
    }

    try {
      const allowed = await checkRateLimit(ip, ownerId, 60, 30);
      if (!allowed) {
        return res.status(429).send("Too many requests");
      }
    } catch (err) {
      console.error("group create rate limit error:", err);
      return res.status(500).send("Rate limiter error");
    }

    try {
      const { rows } = await query<{ id: string }>(
        `
        select id
        from public.players
        where id = $1
        limit 1
        `,
        [ownerId],
      );
      if (!rows[0]) {
        return res.status(404).send("Owner not found");
      }
    } catch (err) {
      console.error("group create owner check error:", err);
      return res.status(500).send("DB error (owner check)");
    }

    const now = new Date().toISOString();

    try {
      const { rows } = await query<{ id: number }>(
        `
        insert into public.groups (name, owner_id, is_public, created_at, updated_at)
        values ($1,$2,$3,$4,$4)
        returning id
        `,
        [name, ownerId, isPublic, now],
      );

      const groupId = rows[0]?.id;
      if (!groupId) {
        return res.status(500).send("DB error (group insert)");
      }

      await query(
        `
        insert into public.group_members (group_id, player_id, role, joined_at)
        values ($1,$2,'owner',$3)
        `,
        [groupId, ownerId, now],
      );

      await recordGroupActivity({
        groupId,
        groupName: name,
        type: "group_created",
        actorId: ownerId,
        createdAt: now,
      });

      // Envoyer l'event au créateur (pas de conversation car groupe vide)
      const ownerInfo = await getPlayerInfo(ownerId);
      if (ownerInfo) {
        pushUnifiedEvent(ownerId, "group_created", {
          groupId,
          groupName: name,
          member: {
            playerId: ownerInfo.playerId,
            name: ownerInfo.name,
            avatarUrl: ownerInfo.avatarUrl,
            avatar: ownerInfo.avatar,
            role: "owner",
            joinedAt: now,
          },
          createdAt: now,
        });
      }

      return res.status(201).json({
        id: groupId,
        name,
        ownerId,
        isPublic,
        createdAt: now,
        updatedAt: now,
      });
    } catch (err) {
      console.error("group create error:", err);
      return res.status(500).send("DB error (group create)");
    }
  });
}
