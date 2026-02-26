import type { Application, Request, Response } from "express";
import { query } from "../../db";
import { getIp } from "../../lib/ip";
import { checkRateLimit } from "../../lib/rateLimit";
import { normalizeId } from "../messages/common";
import { requireApiKey } from "../../middleware/auth";

export function registerGroupListRoute(app: Application): void {
  app.get("/groups", requireApiKey, async (req: Request, res: Response) => {
    const ip = getIp(req);
    const playerId = req.authenticatedPlayerId!;

    if (!playerId || playerId.length < 3) {
      return res.status(400).send("Invalid playerId");
    }

    try {
      const allowed = await checkRateLimit(ip, playerId, 300, 120);
      if (!allowed) {
        return res.status(429).send("Too many requests");
      }
    } catch (err) {
      console.error("groups list rate limit error:", err);
      return res.status(500).send("Rate limiter error");
    }

    try {
        const { rows } = await query<{
          id: number;
          name: string;
          owner_id: string;
          is_public: boolean;
          created_at: string;
          updated_at: string;
          role: string;
          member_count: string;
          preview_members: any;
          unread_count: string;
        }>(
          `
          select
            g.id,
            g.name,
            g.owner_id,
            g.is_public,
            g.created_at,
            g.updated_at,
            gm.role,
            (
              select count(*)::text
              from public.group_members gm2
              where gm2.group_id = g.id
            ) as member_count,
            coalesce(pm.preview_members, '[]'::jsonb) as preview_members,
            (
              select count(*)::text
              from public.group_messages gmsg
              where gmsg.group_id = g.id
                and (gm.last_read_message_id is null or gmsg.id > gm.last_read_message_id)
                and gmsg.sender_id != $1
            ) as unread_count
          from public.group_members gm
          join public.groups g on g.id = gm.group_id
          left join lateral (
            select jsonb_agg(
              jsonb_build_object(
                'playerId', p.id,
                'playerName', coalesce(p.name, p.id),
                'discordAvatarUrl', p.avatar_url,
                'avatar', p.avatar,
                'badges', p.badges
              )
              order by gmp.joined_at asc
            ) as preview_members
            from (
              select gm2.player_id, gm2.joined_at
              from public.group_members gm2
              where gm2.group_id = g.id
              order by gm2.joined_at asc
              limit 3
            ) gmp
            join public.players p on p.id = gmp.player_id
          ) pm on true
          where gm.player_id = $1
          order by g.updated_at desc
          `,
          [playerId],
        );

      const groups = (rows ?? []).map((row) => ({
        id: row.id,
        name: row.name,
        ownerId: row.owner_id,
        isPublic: row.is_public,
        role: row.role,
        memberCount: Number(row.member_count ?? "0"),
        previewMembers: Array.isArray(row.preview_members)
          ? row.preview_members
          : [],
        unreadCount: Number(row.unread_count ?? "0"),
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));

      return res.status(200).json({ playerId, groups });
    } catch (err) {
      console.error("groups list db error:", err);
      return res.status(500).send("DB error");
    }
  });
}
