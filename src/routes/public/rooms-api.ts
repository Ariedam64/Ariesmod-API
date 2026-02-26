import type { Application, Request, Response } from "express";
import { query } from "../../db";
import { getIp } from "../../lib/ip";
import { checkRateLimit } from "../../lib/rateLimit";

export function registerPublicRoomsApiRoute(app: Application): void {
  app.get("/public/rooms", async (req: Request, res: Response) => {
    const ip = getIp(req);

    try {
      const allowed = await checkRateLimit(ip, null, 120, 0);
      if (!allowed) return res.status(429).json({ error: "Too many requests" });
    } catch (err) {
      console.error("public rooms rate limit error:", err);
      return res.status(500).json({ error: "Internal error" });
    }

    try {
      const { rows } = await query(
        `SELECT r.id, r.players_count, r.user_slots
         FROM public.rooms r
         LEFT JOIN public.player_privacy pp
           ON pp.player_id = r.last_updated_by_player_id
         WHERE r.is_private = false
           AND r.players_count > 0
           AND r.players_count < 6
           AND r.last_updated_at >= now() - interval '6 hours'
           AND COALESCE(pp.hide_room_from_public_list, false) = false
         ORDER BY r.players_count DESC, r.last_updated_at DESC
         LIMIT 1000`,
      );

      const rooms = (rows ?? []).map((r: any) => {
        const slots: any[] = Array.isArray(r.user_slots) ? r.user_slots : [];
        const players = slots
          .filter((s: any) => s && (s.name || s.player_id))
          .slice(0, 6)
          .map((s: any) => ({
            name: s.name || "Unknown",
            avatarUrl: s.avatar_url || null,
          }));

        return {
          id: r.id,
          playersCount: Number(r.players_count ?? 0),
          players,
        };
      });

      return res.json({ rooms, count: rooms.length });
    } catch (err) {
      console.error("public rooms query error:", err);
      return res.status(500).json({ error: "Internal error" });
    }
  });
}
