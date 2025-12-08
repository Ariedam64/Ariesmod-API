import type { Application, Request, Response } from "express";
import { query } from "../../db";
import { getIp } from "../../lib/ip";
import { checkRateLimit } from "../../lib/rateLimit";

export function registerFriendRespondRoute(app: Application): void {

app.post("/friend-respond", async (req: Request, res: Response) => {
    const ip = getIp(req);
    const body: any = req.body ?? {};
    const { playerId, otherPlayerId, action } = body;

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

    if (action !== "accept" && action !== "reject") {
      return res.status(400).send("Invalid action");
    }

    try {
      const allowed = await checkRateLimit(ip, playerId);
      if (!allowed) {
        return res.status(429).send("Too many requests");
      }
    } catch (err) {
      console.error("friend-respond rate limit error:", err);
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
      console.error("friend-respond relationship fetch error:", err);
      return res.status(500).send("DB error (relationship fetch)");
    }

    if (!rel) {
      return res.status(404).send("No relationship found");
    }

    if (rel.status !== "pending") {
      return res.status(409).send("Request is not pending");
    }

    if (rel.requested_by === playerId) {
      return res
        .status(403)
        .send("Requester cannot respond to own request");
    }

    const newStatus = action === "accept" ? "accepted" : "rejected";
    const now = new Date().toISOString();

    try {
      await query(
        `
        update public.player_relationships
        set status = $1,
            updated_at = $2
        where user_one_id = $3
          and user_two_id = $4
        `,
        [newStatus, now, userOneId, userTwoId],
      );
    } catch (err) {
      console.error("friend-respond update error:", err);
      return res.status(500).send("DB error (relationship update)");
    }

    return res.status(204).send();
  });
}