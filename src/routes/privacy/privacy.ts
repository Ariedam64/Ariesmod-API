import type { Application, Request, Response } from "express";
import { query } from "../../db";
import { requireApiKey } from "../../middleware/auth";
import { pushUnifiedEvent } from "../events/hub";
import { getFriendIds, getGroupMemberIds } from "../events/presence";

const VALID_SETTINGS = [
  "showGarden",
  "showInventory",
  "showCoins",
  "showActivityLog",
  "showJournal",
  "showStats",
  "hideRoomFromPublicList",
] as const;

type SettingKey = (typeof VALID_SETTINGS)[number];

const SETTING_TO_COLUMN: Record<SettingKey, string> = {
  showGarden: "show_garden",
  showInventory: "show_inventory",
  showCoins: "show_coins",
  showActivityLog: "show_activity_log",
  showJournal: "show_journal",
  showStats: "show_stats",
  hideRoomFromPublicList: "hide_room_from_public_list",
};

export function registerPrivacyRoutes(app: Application): void {
  // GET /privacy — retourne les paramètres de confidentialité du joueur
  app.get("/privacy", requireApiKey, async (req: Request, res: Response) => {
    const pid = req.authenticatedPlayerId!;

    try {
      const { rows } = await query<{
        show_garden: boolean | null;
        show_inventory: boolean | null;
        show_coins: boolean | null;
        show_activity_log: boolean | null;
        show_journal: boolean | null;
        show_stats: boolean | null;
        hide_room_from_public_list: boolean | null;
      }>(
        `select
          show_garden,
          show_inventory,
          show_coins,
          show_activity_log,
          show_journal,
          show_stats,
          hide_room_from_public_list
        from public.player_privacy
        where player_id = $1`,
        [pid],
      );

      const row = rows?.[0];
      return res.status(200).json({
        showGarden: row?.show_garden !== false,
        showInventory: row?.show_inventory !== false,
        showCoins: row?.show_coins !== false,
        showActivityLog: row?.show_activity_log !== false,
        showJournal: row?.show_journal !== false,
        showStats: row?.show_stats !== false,
        hideRoomFromPublicList: row?.hide_room_from_public_list === true,
      });
    } catch (err) {
      console.error("GET /privacy error:", err);
      return res.status(500).json({ error: "DB error" });
    }
  });

  // POST /privacy — met à jour un ou plusieurs paramètres de confidentialité
  app.post("/privacy", requireApiKey, async (req: Request, res: Response) => {
    const pid = req.authenticatedPlayerId!;
    const body: any = req.body ?? {};

    // Extraire uniquement les clés valides avec des valeurs booléennes
    const updates: Partial<Record<SettingKey, boolean>> = {};
    for (const key of VALID_SETTINGS) {
      if (typeof body[key] === "boolean") {
        updates[key] = body[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        error: "No valid privacy settings provided",
        validSettings: [...VALID_SETTINGS],
      });
    }

    // Construire les colonnes et valeurs pour l'upsert
    const columns: string[] = ["player_id", "updated_at"];
    const placeholders: string[] = ["$1", "$2"];
    const conflictSets: string[] = ["updated_at = excluded.updated_at"];
    const params: any[] = [pid, new Date().toISOString()];
    let idx = 3;

    for (const [key, value] of Object.entries(updates)) {
      const column = SETTING_TO_COLUMN[key as SettingKey];
      columns.push(column);
      placeholders.push(`$${idx}`);
      conflictSets.push(`${column} = excluded.${column}`);
      params.push(value);
      idx++;
    }

    try {
      await query(
        `insert into public.player_privacy (${columns.join(", ")})
        values (${placeholders.join(", ")})
        on conflict (player_id) do update set
          ${conflictSets.join(",\n          ")}`,
        params,
      );

      // Relire l'état complet après mise à jour
      const { rows } = await query<{
        show_garden: boolean | null;
        show_inventory: boolean | null;
        show_coins: boolean | null;
        show_activity_log: boolean | null;
        show_journal: boolean | null;
        show_stats: boolean | null;
        hide_room_from_public_list: boolean | null;
      }>(
        `select
          show_garden,
          show_inventory,
          show_coins,
          show_activity_log,
          show_journal,
          show_stats,
          hide_room_from_public_list
        from public.player_privacy
        where player_id = $1`,
        [pid],
      );

      const row = rows?.[0];
      const privacy = {
        showGarden: row?.show_garden !== false,
        showInventory: row?.show_inventory !== false,
        showCoins: row?.show_coins !== false,
        showActivityLog: row?.show_activity_log !== false,
        showJournal: row?.show_journal !== false,
        showStats: row?.show_stats !== false,
        hideRoomFromPublicList: row?.hide_room_from_public_list === true,
      };

      // Émettre l'événement privacy_updated aux amis et membres de groupes
      try {
        const [friendIds, groupMemberIds] = await Promise.all([
          getFriendIds(pid),
          getGroupMemberIds(pid),
        ]);
        // Combine and deduplicate
        const recipientIds = Array.from(new Set([...friendIds, ...groupMemberIds]));

        const payload = { playerId: pid, privacy };
        for (const recipientId of recipientIds) {
          pushUnifiedEvent(recipientId, "privacy_updated", payload);
        }

        // Si hideRoomFromPublicList a changé, mettre à jour rooms.is_private et émettre room_changed
        if ("hideRoomFromPublicList" in updates) {
          const roomResult = await query<{ room_id: string }>(
            `select room_id from public.room_players
             where player_id = $1 and left_at is null
             limit 1`,
            [pid],
          );
          const currentRoomId = roomResult.rows?.[0]?.room_id ?? null;

          if (currentRoomId) {
            // Mettre à jour is_private dans la table rooms
            await query(
              `update public.rooms set is_private = CASE
                WHEN admin_privacy_override = 'private' THEN true
                WHEN admin_privacy_override = 'public' THEN false
                ELSE $1
              END where id = $2`,
              [privacy.hideRoomFromPublicList, currentRoomId],
            );

            // Émettre room_changed aux amis et membres de groupes
            if (recipientIds.length > 0) {
              const visibleRoomId = privacy.hideRoomFromPublicList ? null : currentRoomId;
              const previousRoomId = privacy.hideRoomFromPublicList ? currentRoomId : null;
              const roomPayload = { playerId: pid, roomId: visibleRoomId, previousRoomId };
              for (const recipientId of recipientIds) {
                pushUnifiedEvent(recipientId, "room_changed", roomPayload);
              }
            }
          }
        }
      } catch (err) {
        console.error("privacy event emit error:", err);
      }

      return res.status(200).json(privacy);
    } catch (err) {
      console.error("POST /privacy error:", err);
      return res.status(500).json({ error: "DB error" });
    }
  });
}
