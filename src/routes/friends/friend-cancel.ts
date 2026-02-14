import type { Application, Request, Response } from "express";
import { query } from "../../db";
import { getIp } from "../../lib/ip";
import { checkRateLimit } from "../../lib/rateLimit";
import { pushUnifiedEvent } from "../events/hub";
import { requireApiKey } from "../../middleware/auth";

export function registerFriendCancelRoute(app: Application): void {

app.post("/friend-cancel", requireApiKey, async (req: Request, res: Response) => {
    const ip = getIp(req);
    const body: any = req.body ?? {};
    const playerId = req.authenticatedPlayerId!;
    const { otherPlayerId } = body;

    console.log(`[friend-cancel] playerId from token: ${playerId} (type: ${typeof playerId})`);
    console.log(`[friend-cancel] otherPlayerId from body: ${otherPlayerId} (type: ${typeof otherPlayerId})`);
    console.log(`[friend-cancel] body:`, body);

    if (
      typeof playerId !== "string" ||
      typeof otherPlayerId !== "string" ||
      playerId.length < 3 ||
      otherPlayerId.length < 3
    ) {
      console.log(`[friend-cancel] Validation failed - returning 400`);
      return res.status(400).send("Invalid player ids");
    }

    if (playerId === otherPlayerId) {
      return res.status(400).send("Invalid self relation");
    }

    try {
      const allowed = await checkRateLimit(ip, playerId);
      if (!allowed) {
        return res.status(429).send("Too many requests");
      }
    } catch (err) {
      console.error("friend-cancel rate limit error:", err);
      return res.status(500).send("Rate limiter error");
    }

    const [userOneId, userTwoId] =
      playerId < otherPlayerId
        ? [playerId, otherPlayerId]
        : [otherPlayerId, playerId];

    let rel: { status: string; requested_by: string } | null = null;

    try {
      const { rows } = await query<{
        status: string;
        requested_by: string;
      }>(
        `
        select status, requested_by
        from public.player_relationships
        where user_one_id = $1
          and user_two_id = $2
        limit 1
        `,
        [userOneId, userTwoId],
      );

      rel = rows[0] ?? null;
    } catch (err) {
      console.error("friend-cancel relationship fetch error:", err);
      return res.status(500).send("DB error (relationship fetch)");
    }

    if (!rel) {
      return res.status(404).send("No relationship found");
    }

    if (rel.status !== "pending") {
      return res.status(409).send("Request is not pending");
    }

    if (rel.requested_by !== playerId) {
      return res.status(403).send("Only the requester can cancel the request");
    }

    try {
      await query(
        `
        delete from public.player_relationships
        where user_one_id = $1
          and user_two_id = $2
        `,
        [userOneId, userTwoId],
      );
    } catch (err) {
      console.error("friend-cancel delete error:", err);
      return res.status(500).send("DB error (relationship delete)");
    }

    // Récupérer les infos des deux joueurs
    let playerInfo: Array<{
      id: string;
      name: string | null;
      avatar_url: string | null;
    }> = [];

    try {
      const { rows } = await query<{
        id: string;
        name: string | null;
        avatar_url: string | null;
      }>(
        `
        select id, name, avatar_url
        from public.players
        where id = any($1::text[])
        `,
        [[playerId, otherPlayerId]],
      );
      playerInfo = rows ?? [];
    } catch (err) {
      console.error("friend-cancel player info error:", err);
    }

    const requester = playerInfo.find((p) => p.id === playerId);
    const target = playerInfo.find((p) => p.id === otherPlayerId);

    const now = new Date().toISOString();
    const payload = {
      requesterId: playerId,
      requesterName: requester?.name ?? playerId,
      requesterAvatarUrl: requester?.avatar_url ?? null,
      targetId: otherPlayerId,
      targetName: target?.name ?? otherPlayerId,
      targetAvatarUrl: target?.avatar_url ?? null,
      cancelledAt: now,
    };
    pushUnifiedEvent(playerId, "friend_cancelled", payload);
    pushUnifiedEvent(otherPlayerId, "friend_cancelled", payload);

    return res.status(204).send();
  });

}
