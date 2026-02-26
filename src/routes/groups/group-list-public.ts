import type { Application, Request, Response } from "express";
import { query } from "../../db";
import { getIp } from "../../lib/ip";
import { checkRateLimit } from "../../lib/rateLimit";
import { requireApiKey } from "../../middleware/auth";

export function registerGroupListPublicRoute(app: Application): void {
  app.get("/groups/public", requireApiKey, async (req: Request, res: Response) => {
    const ip = getIp(req);
    const playerId = req.authenticatedPlayerId!;

    if (!playerId || playerId.length < 3) {
      return res.status(400).send("Invalid playerId");
    }

    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 50);
    const offset = Math.max(Number(req.query.offset) || 0, 0);

    try {
      const allowed = await checkRateLimit(ip, playerId, 300, 120);
      if (!allowed) {
        return res.status(429).send("Too many requests");
      }
    } catch (err) {
      console.error("groups list public rate limit error:", err);
      return res.status(500).send("Rate limiter error");
    }

    try {
      const params: any[] = [playerId, limit, offset];
      let searchClause = "";
      if (search.length > 0) {
        searchClause = "and g.name ilike $4";
        params.push(`%${search}%`);
      }

      const { rows } = await query<{
        id: number;
        name: string;
        owner_id: string;
        created_at: string;
        updated_at: string;
        member_count: string;
        preview_members: any;
      }>(
        `
        select
          g.id,
          g.name,
          g.owner_id,
          g.created_at,
          g.updated_at,
          (
            select count(*)::text
            from public.group_members gm2
            where gm2.group_id = g.id
          ) as member_count,
          coalesce(pm.preview_members, '[]'::jsonb) as preview_members
        from public.groups g
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
        where g.is_public = true
          and not exists (
            select 1
            from public.group_members gm
            where gm.group_id = g.id
              and gm.player_id = $1
          )
          ${searchClause}
        order by g.updated_at desc
        limit $2
        offset $3
        `,
        params,
      );

      const groups = (rows ?? []).map((row) => ({
        id: row.id,
        name: row.name,
        ownerId: row.owner_id,
        memberCount: Number(row.member_count ?? "0"),
        previewMembers: Array.isArray(row.preview_members)
          ? row.preview_members
          : [],
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));

      return res.status(200).json({ groups });
    } catch (err) {
      console.error("groups list public db error:", err);
      return res.status(500).send("DB error");
    }
  });
}
