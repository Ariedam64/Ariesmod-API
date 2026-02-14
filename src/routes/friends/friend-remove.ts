import type { Application, Request, Response } from "express";
import { query } from "../../db";
import { getIp } from "../../lib/ip";
import { checkRateLimit } from "../../lib/rateLimit";
import { pushUnifiedEvent } from "../events/hub";
import { requireApiKey } from "../../middleware/auth";

export function registerFriendRemoveRoute(app: Application): void {

app.post("/friend-remove", requireApiKey, async (req: Request, res: Response) => {
    const ip = getIp(req);
    const body: any = req.body ?? {};
    const playerId = req.authenticatedPlayerId!;
    const { otherPlayerId } = body;

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

    try {
      const allowed = await checkRateLimit(ip, playerId);
      if (!allowed) {
        return res.status(429).send("Too many requests");
      }
    } catch (err) {
      console.error("friend-remove rate limit error:", err);
      return res.status(500).send("Rate limiter error");
    }

    const [userOneId, userTwoId] =
      playerId < otherPlayerId
        ? [playerId, otherPlayerId]
        : [otherPlayerId, playerId];

    let rel: { status: string } | null = null;

    try {
      const { rows } = await query<{ status: string }>(
        `
        select status
        from public.player_relationships
        where user_one_id = $1
          and user_two_id = $2
        limit 1
        `,
        [userOneId, userTwoId],
      );
      rel = rows[0] ?? null;
    } catch (err) {
      console.error("friend-remove relationship fetch error:", err);
      return res.status(500).send("DB error (relationship fetch)");
    }

    if (!rel) {
      return res.status(404).send("No relationship found");
    }

    if (rel.status !== "accepted") {
      return res.status(409).send("Not friends");
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
      console.error("friend-remove delete error:", err);
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
      console.error("friend-remove player info error:", err);
    }

    const remover = playerInfo.find((p) => p.id === playerId);
    const removed = playerInfo.find((p) => p.id === otherPlayerId);

    const now = new Date().toISOString();
    const payload = {
      removerId: playerId,
      removerName: remover?.name ?? playerId,
      removerAvatarUrl: remover?.avatar_url ?? null,
      removedId: otherPlayerId,
      removedName: removed?.name ?? otherPlayerId,
      removedAvatarUrl: removed?.avatar_url ?? null,
      removedAt: now,
    };
    pushUnifiedEvent(playerId, "friend_removed", payload);
    pushUnifiedEvent(otherPlayerId, "friend_removed", payload);

    return res.status(204).send();
  });
}
