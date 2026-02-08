import type { Application, Request, Response } from "express";
import { query } from "../../db";
import { getIp } from "../../lib/ip";
import { checkRateLimit } from "../../lib/rateLimit";
import { pushRequestEvent } from "./requests-stream-hub";

export function registerFriendRequestRoute(app: Application): void {

app.post("/friend-request", async (req: Request, res: Response) => {
    const ip = getIp(req);
    const body: any = req.body ?? {};
    const { fromPlayerId, toPlayerId } = body;

    if (
      typeof fromPlayerId !== "string" ||
      typeof toPlayerId !== "string" ||
      fromPlayerId.length < 3 ||
      toPlayerId.length < 3
    ) {
      return res.status(400).send("Invalid player ids");
    }

    if (fromPlayerId === toPlayerId) {
      return res.status(400).send("Cannot friend yourself");
    }

    // rate limit IP + émetteur
    try {
      const allowed = await checkRateLimit(ip, fromPlayerId);
      if (!allowed) {
        return res.status(429).send("Too many requests");
      }
    } catch (err) {
      console.error("friend-request rate limit error:", err);
      return res.status(500).send("Rate limiter error");
    }

    const [userOneId, userTwoId] =
      fromPlayerId < toPlayerId
        ? [fromPlayerId, toPlayerId]
        : [toPlayerId, fromPlayerId];

    let hadRejectedRelation = false;

    // vérifier que les deux players existent
    try {
      const { rows: players } = await query<{ id: string }>(
        `
        select id
        from public.players
        where id = any($1::text[])
        `,
        [[fromPlayerId, toPlayerId]],
      );

      if (!players || players.length < 2) {
        return res.status(404).send("One or both players not found");
      }
    } catch (err) {
      console.error("friend-request players check error:", err);
      return res.status(500).send("DB error (players check)");
    }

    // check relation existante
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

      const existing = rows[0];

      if (existing) {
        if (existing.status === "accepted") {
          return res.status(409).send("Already friends");
        }
        if (existing.status === "pending") {
          return res.status(409).send("Friend request already pending");
        }
        if (existing.status === "rejected") {
          hadRejectedRelation = true;
        }
      }
    } catch (err) {
      console.error("friend-request relationship check error:", err);
      return res.status(500).send("DB error (relationship check)");
    }

    if (hadRejectedRelation) {
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
        console.error("friend-request cleanup rejected error:", err);
        return res.status(500).send("DB error (cleanup rejected)");
      }
    }

    // créer la demande
    try {
      const now = new Date().toISOString();
      await query(
        `
        insert into public.player_relationships (
          user_one_id,
          user_two_id,
          requested_by,
          status
        )
        values ($1,$2,$3,'pending')
        `,
        [userOneId, userTwoId, fromPlayerId],
      );

      const payload = {
        requesterId: fromPlayerId,
        targetId: toPlayerId,
        createdAt: now,
      };

      pushRequestEvent(toPlayerId, "friend_request", payload);
      pushRequestEvent(fromPlayerId, "friend_request", payload);
    } catch (err) {
      console.error("friend-request insert error:", err);
      return res.status(500).send("DB error (create request)");
    }

    return res.status(204).send();
  });

}
