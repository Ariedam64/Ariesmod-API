import type { Application, Request, Response } from "express";
import { query } from "../../db";
import { adminAuth } from "./common";

const VALID_BADGES = new Set(["mod_creator", "supporter"]);

export function registerAdminBadgesRoutes(app: Application): void {
  // Add a badge to a player
  app.post(
    "/admin/player/:playerId/badge",
    adminAuth,
    async (req: Request, res: Response) => {
      const playerId = String(req.params.playerId ?? "").trim();
      const badge = String(req.body?.badge ?? "").trim();

      if (!playerId) {
        res.status(400).json({ error: "Missing playerId" });
        return;
      }
      if (!badge || !VALID_BADGES.has(badge)) {
        res.status(400).json({ error: "Invalid badge", valid: Array.from(VALID_BADGES) });
        return;
      }

      try {
        const { rows } = await query(
          `UPDATE public.players
           SET badges = array_append(badges, $2::text)
           WHERE id = $1
             AND NOT ($2::text = ANY(badges))
           RETURNING badges`,
          [playerId, badge],
        );

        if (!rows[0]) {
          // Either player not found or badge already present — check which
          const { rows: check } = await query(
            `SELECT badges FROM public.players WHERE id = $1`,
            [playerId],
          );
          if (!check[0]) {
            res.status(404).json({ error: "Player not found" });
            return;
          }
          res.json({ badges: check[0].badges });
          return;
        }

        res.json({ badges: rows[0].badges });
      } catch (err) {
        console.error("[admin] add badge error:", err);
        res.status(500).json({ error: "DB error" });
      }
    },
  );

  // Remove a badge from a player
  app.delete(
    "/admin/player/:playerId/badge/:badge",
    adminAuth,
    async (req: Request, res: Response) => {
      const playerId = String(req.params.playerId ?? "").trim();
      const badge = String(req.params.badge ?? "").trim();

      if (!playerId) {
        res.status(400).json({ error: "Missing playerId" });
        return;
      }
      if (!badge || !VALID_BADGES.has(badge)) {
        res.status(400).json({ error: "Invalid badge", valid: Array.from(VALID_BADGES) });
        return;
      }

      try {
        const { rows } = await query(
          `UPDATE public.players
           SET badges = array_remove(badges, $2::text)
           WHERE id = $1
           RETURNING badges`,
          [playerId, badge],
        );

        if (!rows[0]) {
          res.status(404).json({ error: "Player not found" });
          return;
        }

        res.json({ badges: rows[0].badges });
      } catch (err) {
        console.error("[admin] remove badge error:", err);
        res.status(500).json({ error: "DB error" });
      }
    },
  );
}
