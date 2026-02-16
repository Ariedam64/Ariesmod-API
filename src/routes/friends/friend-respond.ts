import type { Application, Request, Response } from "express";
import { query } from "../../db";
import { getIp } from "../../lib/ip";
import { checkRateLimit } from "../../lib/rateLimit";
import { pushUnifiedEvent } from "../events/hub";
import { requireApiKey } from "../../middleware/auth";
import { CONNECTED_TTL_MS } from "../messages/common";

export function registerFriendRespondRoute(app: Application): void {

app.post("/friend-respond", requireApiKey, async (req: Request, res: Response) => {
    const ip = getIp(req);
    const body: any = req.body ?? {};
    const playerId = req.authenticatedPlayerId!;
    const { otherPlayerId, action } = body;

    if (
      !playerId ||
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

    const now = new Date().toISOString();

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
        [[rel.requested_by, playerId]],
      );
      playerInfo = rows ?? [];
    } catch (err) {
      console.error("friend-respond player info error:", err);
    }

    const requester = playerInfo.find((p) => p.id === rel.requested_by);
    const responder = playerInfo.find((p) => p.id === playerId);

    if (action === "reject") {
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
        console.error("friend-respond delete error:", err);
        return res.status(500).send("DB error (relationship delete)");
      }

      const payload = {
        requesterId: rel.requested_by,
        requesterName: requester?.name ?? rel.requested_by,
        requesterAvatarUrl: requester?.avatar_url ?? null,
        responderId: playerId,
        responderName: responder?.name ?? playerId,
        responderAvatarUrl: responder?.avatar_url ?? null,
        action,
        updatedAt: now,
      };
      pushUnifiedEvent(rel.requested_by, "friend_response", payload);
      pushUnifiedEvent(playerId, "friend_response", payload);

      return res.status(204).send();
    }

    try {
      await query(
        `
        update public.player_relationships
        set status = $1,
            updated_at = $2
        where user_one_id = $3
          and user_two_id = $4
        `,
        ["accepted", now, userOneId, userTwoId],
      );
    } catch (err) {
      console.error("friend-respond update error:", err);
      return res.status(500).send("DB error (relationship update)");
    }

    // Fetch room and online status for both players
    let requesterRoomId: string | null = null;
    let requesterIsOnline = false;
    let responderRoomId: string | null = null;
    let responderIsOnline = false;

    try {
      const { rows } = await query<{
        player_id: string;
        last_event_at: string | null;
        room_id: string | null;
        is_private: boolean | null;
        hide_room_from_public_list: boolean | null;
      }>(
        `
        select
          p.id as player_id,
          p.last_event_at,
          rp.room_id,
          r.is_private,
          pp.hide_room_from_public_list
        from public.players p
        left join public.room_players rp
          on rp.player_id = p.id
          and rp.left_at is null
        left join public.rooms r
          on r.id = rp.room_id
        left join public.player_privacy pp
          on pp.player_id = p.id
        where p.id = any($1::text[])
        `,
        [[rel.requested_by, playerId]],
      );

      const nowTs = Date.now();
      for (const row of rows) {
        const lastEventTs = row.last_event_at
          ? Date.parse(row.last_event_at)
          : null;
        const isOnline =
          lastEventTs !== null && nowTs - lastEventTs <= CONNECTED_TTL_MS;
        const roomHidden =
          row.is_private || row.hide_room_from_public_list === true;
        const roomId = row.room_id && !roomHidden ? row.room_id : null;

        if (row.player_id === rel.requested_by) {
          requesterRoomId = roomId;
          requesterIsOnline = isOnline;
        } else if (row.player_id === playerId) {
          responderRoomId = roomId;
          responderIsOnline = isOnline;
        }
      }
    } catch (err) {
      console.error("friend-respond presence fetch error:", err);
      // Continue without presence info if fetch fails
    }

    const payload = {
      requesterId: rel.requested_by,
      requesterName: requester?.name ?? rel.requested_by,
      requesterAvatarUrl: requester?.avatar_url ?? null,
      requesterRoomId,
      requesterIsOnline,
      responderId: playerId,
      responderName: responder?.name ?? playerId,
      responderAvatarUrl: responder?.avatar_url ?? null,
      responderRoomId,
      responderIsOnline,
      action,
      updatedAt: now,
    };
    pushUnifiedEvent(rel.requested_by, "friend_response", payload);
    pushUnifiedEvent(playerId, "friend_response", payload);

    return res.status(204).send();
  });
}
