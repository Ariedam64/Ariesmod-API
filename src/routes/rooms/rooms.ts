import type { Application, Request, Response } from "express";
import { query } from "../../db";
import { getIp } from "../../lib/ip";
import { checkRateLimit } from "../../lib/rateLimit";

const ROOM_TTL_MINUTES = 6 * 60 * 1000;

export function registerRoomsRoute(app: Application): void {
  app.get("/rooms", async (req: Request, res: Response) => {
    let limit = Number(req.query.limit ?? 50);
    if (!Number.isFinite(limit) || limit <= 0) limit = 50;
    if (limit > 200) limit = 200;

    const now = Date.now();
    const cutoff = new Date(
      now - ROOM_TTL_MINUTES,
    ).toISOString();

    // cleanup paresseux
    try {
      await query(
        `delete from public.rooms where last_updated_at < $1`,
        [cutoff],
      );
    } catch (err) {
      console.error("list-rooms cleanup error:", err);
      // on ne bloque pas pour ça
    }

    try {
      const { rows } = await query(
        `
        select
          id,
          is_private,
          players_count,
          last_updated_at,
          last_updated_by_player_id,
          user_slots
        from public.rooms
        where is_private = false
          and last_updated_at >= $1
        order by last_updated_at desc
        limit $2
        `,
        [cutoff, limit],
      );

      return res.status(200).json(rows ?? []);
    } catch (err) {
      console.error("list-rooms error:", err);
      return res.status(500).send("DB error");
    }
  });

}