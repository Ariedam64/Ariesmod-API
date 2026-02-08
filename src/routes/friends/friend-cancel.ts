import type { Application, Request, Response } from "express";
import { query } from "../../db";
import { getIp } from "../../lib/ip";
import { checkRateLimit } from "../../lib/rateLimit";
import { pushRequestEvent } from "./requests-stream-hub";

export function registerFriendCancelRoute(app: Application): void {

app.post("/friend-cancel", async (req: Request, res: Response) => {
    const ip = getIp(req);
    const body: any = req.body ?? {};
    const { playerId, otherPlayerId } = body;

    if (
      typeof playerId !== "string" ||
      typeof otherPlayerId !== "string" ||
      playerId.length < 3 ||
      otherPlayerId.length < 3
    ) {
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

    const now = new Date().toISOString();
    const payload = {
      requesterId: playerId,
      targetId: otherPlayerId,
      cancelledAt: now,
    };
    pushRequestEvent(playerId, "friend_cancelled", payload);
    pushRequestEvent(otherPlayerId, "friend_cancelled", payload);

    return res.status(204).send();
  });

}
