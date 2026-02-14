import type { Application, Request, Response } from "express";
import { query } from "../../db";
import { adminAuth, clampNumber } from "./common";

function parseRoomFilters(req: Request) {
  const q = String(req.query.q ?? "").trim();
  const typeRaw = String(req.query.type ?? "all").toLowerCase();
  const statusRaw = String(req.query.status ?? "active").toLowerCase();
  const type =
    typeRaw === "public" || typeRaw === "private" ? typeRaw : "all";
  const status =
    statusRaw === "active" || statusRaw === "inactive" || statusRaw === "all"
      ? statusRaw
      : "active";
  const limit = clampNumber(req.query.limit, 50, 1, 200);
  const offset = clampNumber(req.query.offset, 0, 0, 100000);
  let minPlayers = clampNumber(req.query.minPlayers, 0, 0, 6);
  let maxPlayers = clampNumber(req.query.maxPlayers, 6, 0, 6);
  if (minPlayers > maxPlayers) {
    const tmp = minPlayers;
    minPlayers = maxPlayers;
    maxPlayers = tmp;
  }
  return { q, type, status, minPlayers, maxPlayers, limit, offset };
}

export function registerAdminRoomsRoutes(app: Application): void {
  // Rooms overview (stats + charts + recent + live)
  app.get("/admin/rooms-view", adminAuth, async (_req, res: Response) => {
    try {
      const [
        { rows: [stats] },
        { rows: occupancyRows },
        { rows: recentRooms },
        { rows: liveRooms },
      ] = await Promise.all([
        query(
          `
          SELECT
            count(*)::int AS total,
            count(*) FILTER (WHERE NOT is_private)::int AS public,
            count(*) FILTER (WHERE is_private)::int AS private,
            count(*) FILTER (WHERE last_updated_at >= now() - interval '1 hour')::int AS active_1h,
            count(*) FILTER (WHERE last_updated_at >= now() - interval '5 minutes')::int AS active_5m,
            coalesce(avg(players_count), 0)::numeric(10,2) AS avg_players
          FROM public.rooms
          `,
        ),
        query(
          `
          WITH buckets AS (
            SELECT LEAST(players_count, 6) AS bucket, count(*)::int AS count
            FROM public.rooms
            GROUP BY LEAST(players_count, 6)
          )
          SELECT gs.bucket, coalesce(b.count, 0)::int AS count
          FROM generate_series(0,6) AS gs(bucket)
          LEFT JOIN buckets b ON b.bucket = gs.bucket
          ORDER BY gs.bucket ASC
          `,
        ),
        query(
          `
          SELECT r.id, r.is_private, r.players_count, r.created_at, r.last_updated_at,
            c.player_id AS creator_id,
            c.player_name AS creator_name
          FROM public.rooms r
          LEFT JOIN LATERAL (
            SELECT rp.player_id, p.name AS player_name
            FROM public.room_players rp
            LEFT JOIN public.players p ON p.id = rp.player_id
            WHERE rp.room_id = r.id
            ORDER BY rp.joined_at ASC NULLS LAST
            LIMIT 1
          ) c ON true
          ORDER BY r.created_at DESC
          LIMIT 10
          `,
        ),
        query(
          `
          SELECT r.id, r.is_private, r.players_count, r.created_at, r.last_updated_at,
            c.player_id AS creator_id,
            c.player_name AS creator_name
          FROM public.rooms r
          LEFT JOIN LATERAL (
            SELECT rp.player_id, p.name AS player_name
            FROM public.room_players rp
            LEFT JOIN public.players p ON p.id = rp.player_id
            WHERE rp.room_id = r.id
            ORDER BY rp.joined_at ASC NULLS LAST
            LIMIT 1
          ) c ON true
          WHERE r.last_updated_at >= now() - interval '1 hour'
          ORDER BY r.last_updated_at DESC
          LIMIT 20
          `,
        ),
      ]);

      res.json({
        ts: new Date().toISOString(),
        stats: stats ?? null,
        occupancy: occupancyRows ?? [],
        recent_rooms: recentRooms ?? [],
        live_rooms: liveRooms ?? [],
      });
    } catch (err) {
      console.error("[admin] rooms-view error:", err);
      res.status(500).json({ error: "DB error" });
    }
  });

  // Rooms list (filters + pagination)
  app.get("/admin/rooms-list", adminAuth, async (req, res: Response) => {
    const { q, type, status, minPlayers, maxPlayers, limit, offset } =
      parseRoomFilters(req);

    const conditions: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (q) {
      params.push(`%${q}%`);
      conditions.push(`r.id ILIKE $${idx++}`);
    }
    if (type === "public") conditions.push(`r.is_private = false`);
    if (type === "private") conditions.push(`r.is_private = true`);
    if (status === "active") {
      conditions.push(`r.last_updated_at >= now() - interval '1 hour'`);
    } else if (status === "inactive") {
      conditions.push(
        `(r.last_updated_at < now() - interval '1 hour' OR r.last_updated_at IS NULL)`,
      );
    }
    if (Number.isFinite(minPlayers)) {
      params.push(minPlayers);
      conditions.push(`r.players_count >= $${idx++}`);
    }
    if (Number.isFinite(maxPlayers)) {
      params.push(maxPlayers);
      conditions.push(`r.players_count <= $${idx++}`);
    }

    const whereClause = conditions.length
      ? "where " + conditions.join(" and ")
      : "";

    try {
      const [{ rows: rooms }, { rows: [totalRow] }] = await Promise.all([
        query(
          `
          SELECT r.id, r.is_private, r.players_count, r.created_at, r.last_updated_at,
            r.last_updated_by_player_id,
            c.player_id AS creator_id,
            c.player_name AS creator_name
          FROM public.rooms r
          LEFT JOIN LATERAL (
            SELECT rp.player_id, p.name AS player_name
            FROM public.room_players rp
            LEFT JOIN public.players p ON p.id = rp.player_id
            WHERE rp.room_id = r.id
            ORDER BY rp.joined_at ASC NULLS LAST
            LIMIT 1
          ) c ON true
          ${whereClause}
          ORDER BY r.players_count DESC NULLS LAST, r.last_updated_at DESC NULLS LAST
          LIMIT $${idx} OFFSET $${idx + 1}
          `,
          [...params, limit, offset],
        ),
        query(
          `
          SELECT count(*)::int AS total
          FROM public.rooms r
          ${whereClause}
          `,
          params,
        ),
      ]);

      res.json({
        rooms: rooms ?? [],
        total: Number(totalRow?.total ?? 0),
        limit,
        offset,
      });
    } catch (err) {
      console.error("[admin] rooms-list error:", err);
      res.status(500).json({ error: "DB error" });
    }
  });
}
