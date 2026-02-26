import type { Application, Request, Response } from "express";
import { query } from "../../db";
import { adminAuth } from "./common";
import { pushUnifiedEvent, getOnlinePlayerIds } from "../events/hub";

export function registerAdminBroadcastRoutes(app: Application): void {
  // Search endpoints (registered before parameterised routes)
  app.get("/admin/broadcasts/search/players", adminAuth, async (req: Request, res: Response) => {
    const q = String(req.query.q ?? "").trim();
    try {
      const { rows } = await query(
        `select id, name from public.players
         where id ilike $1 or name ilike $1
         order by name limit 10`,
        [`%${q}%`],
      );
      res.json({ results: rows.map((r: any) => ({ id: r.id, label: r.name || r.id })) });
    } catch (err) {
      console.error("[admin] broadcast search players error:", err);
      res.status(500).json({ error: "DB error" });
    }
  });

  app.get("/admin/broadcasts/search/rooms", adminAuth, async (req: Request, res: Response) => {
    const q = String(req.query.q ?? "").trim();
    try {
      const { rows } = await query(
        `select id, players_count from public.rooms
         where id ilike $1
         order by players_count desc, last_updated_at desc limit 10`,
        [`%${q}%`],
      );
      res.json({
        results: rows.map((r: any) => ({
          id: r.id,
          label: `${r.id} (${r.players_count} players)`,
        })),
      });
    } catch (err) {
      console.error("[admin] broadcast search rooms error:", err);
      res.status(500).json({ error: "DB error" });
    }
  });

  app.get("/admin/broadcasts/search/groups", adminAuth, async (req: Request, res: Response) => {
    const q = String(req.query.q ?? "").trim();
    try {
      const { rows } = await query(
        `select id, name from public.groups
         where id::text ilike $1 or name ilike $1
         order by name limit 10`,
        [`%${q}%`],
      );
      res.json({
        results: rows.map((r: any) => ({
          id: String(r.id),
          label: `${r.name} #${r.id}`,
        })),
      });
    } catch (err) {
      console.error("[admin] broadcast search groups error:", err);
      res.status(500).json({ error: "DB error" });
    }
  });

  // List all broadcasts with receipt counts
  app.get("/admin/broadcasts", adminAuth, async (_req: Request, res: Response) => {
    try {
      const { rows } = await query(
        `select
           b.id,
           b.action,
           b.data,
           b.target_type,
           b.target_player_ids,
           b.expires_at,
           b.created_at,
           count(r.player_id)::int as receipt_count
         from public.admin_broadcasts b
         left join public.admin_broadcast_receipts r on r.broadcast_id = b.id
         group by b.id
         order by b.created_at desc
         limit 100`,
        [],
      );
      res.json({ broadcasts: rows });
    } catch (err) {
      console.error("[admin] broadcasts list error:", err);
      res.status(500).json({ error: "DB error" });
    }
  });

  // Send a broadcast
  app.post("/admin/broadcasts", adminAuth, async (req: Request, res: Response) => {
    const action = String(req.body?.action ?? "").trim();
    const data = req.body?.data ?? null;
    const targetType = String(req.body?.targetType ?? "all").trim();
    // targetIds: used for room/group multi-select (stored in target_player_ids column)
    const targetIds: string[] = Array.isArray(req.body?.targetIds)
      ? req.body.targetIds.map((id: unknown) => String(id).trim()).filter(Boolean)
      : [];
    // targetPlayerIds: used for players multi-select
    const targetPlayerIds: string[] = Array.isArray(req.body?.targetPlayerIds)
      ? req.body.targetPlayerIds.map((id: unknown) => String(id).trim()).filter(Boolean)
      : [];
    const expiresAt = req.body?.expiresAt ? String(req.body.expiresAt).trim() : null;

    if (!action) {
      res.status(400).json({ error: "Missing action" });
      return;
    }

    const VALID_TARGET_TYPES = new Set(["all", "room", "group", "players"]);
    if (!VALID_TARGET_TYPES.has(targetType)) {
      res.status(400).json({ error: "Invalid targetType" });
      return;
    }

    if ((targetType === "room" || targetType === "group") && targetIds.length === 0) {
      res.status(400).json({ error: "targetIds required for this targetType" });
      return;
    }

    if (targetType === "players" && targetPlayerIds.length === 0) {
      res.status(400).json({ error: "targetPlayerIds required for targetType=players" });
      return;
    }

    try {
      // Store broadcast — reuse target_player_ids column for all non-'all' target ID arrays
      const storedIds =
        targetType === "players" ? targetPlayerIds :
        targetType === "all"    ? null :
                                  targetIds;

      const { rows: [broadcast] } = await query(
        `insert into public.admin_broadcasts (action, data, target_type, target_player_ids, expires_at)
         values ($1, $2, $3, $4, $5)
         returning id, action, data, target_type, target_player_ids, expires_at, created_at`,
        [action, data, targetType, storedIds, expiresAt],
      );

      // Resolve target player IDs
      let playerIds: string[] = [];

      if (targetType === "all") {
        const { rows } = await query(
          `select id from public.players where has_mod_installed = true`,
          [],
        );
        playerIds = rows.map((r: any) => r.id);
      } else if (targetType === "room") {
        const { rows } = await query(
          `select distinct player_id from public.room_players
           where room_id = any($1) and left_at is null`,
          [targetIds],
        );
        playerIds = rows.map((r: any) => r.player_id);
      } else if (targetType === "group") {
        const { rows } = await query(
          `select player_id from public.group_members
           where group_id = any($1::bigint[])`,
          [targetIds],
        );
        playerIds = rows.map((r: any) => r.player_id);
      } else if (targetType === "players") {
        playerIds = targetPlayerIds;
      }

      if (playerIds.length === 0) {
        res.json({ broadcast, sent: 0, total: 0 });
        return;
      }

      // Push to online players via SSE + record receipts
      const onlineIds = new Set(getOnlinePlayerIds());
      const payload = { action: broadcast.action, data: broadcast.data, broadcastId: broadcast.id };
      const onlineTargets = playerIds.filter((id) => onlineIds.has(id));

      for (const playerId of onlineTargets) {
        pushUnifiedEvent(playerId, "admin_broadcast", payload);
      }

      if (onlineTargets.length > 0) {
        await query(
          `insert into public.admin_broadcast_receipts (broadcast_id, player_id)
           select $1, unnest($2::text[])
           on conflict do nothing`,
          [broadcast.id, onlineTargets],
        );
      }

      res.json({ broadcast, sent: onlineTargets.length, total: playerIds.length });
    } catch (err) {
      console.error("[admin] broadcast send error:", err);
      res.status(500).json({ error: "DB error" });
    }
  });

  // Delete a broadcast
  app.delete("/admin/broadcasts/:id", adminAuth, async (req: Request, res: Response) => {
    const id = parseInt(String(req.params.id ?? ""), 10);
    if (!Number.isFinite(id)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }

    try {
      const { rows } = await query(
        `delete from public.admin_broadcasts where id = $1 returning id`,
        [id],
      );
      if (!rows[0]) {
        res.status(404).json({ error: "Not found" });
        return;
      }
      res.json({ ok: true });
    } catch (err) {
      console.error("[admin] broadcast delete error:", err);
      res.status(500).json({ error: "DB error" });
    }
  });
}
