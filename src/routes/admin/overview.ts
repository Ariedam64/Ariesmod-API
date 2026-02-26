import type { Application, Request, Response } from "express";
import { query } from "../../db";
import { adminAuth } from "./common";

const RATE_LIMIT_TTL_MS = 60_000;
const REQUESTS_TTL_MS = 60_000;

let rateLimitCache: {
  ts: number;
  data: { total_hits: number; unique_ips: number; unique_players: number };
} | null = null;
let rateLimitInflight: Promise<void> | null = null;

let requestsCache: { ts: number; rows: Array<{ hr: string; count: number }> } | null =
  null;
let requestsInflight: Promise<void> | null = null;

function toNumber(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return n;
}

async function refreshRateLimit24h(): Promise<void> {
  const start = Date.now();
  const {
    rows: [row],
  } = await query(
    `SELECT
      coalesce(sum(hit_count), 0)::bigint AS total_hits,
      count(DISTINCT ip)::int AS unique_ips,
      count(DISTINCT player_id)::int AS unique_players
    FROM public.rate_limit_usage
    WHERE bucket_start >= now() - interval '24 hours'`,
  );
  console.log(`[admin] overview rate_limit_24h ${Date.now() - start}ms`);
  rateLimitCache = {
    ts: Date.now(),
    data: {
      total_hits: toNumber(row?.total_hits),
      unique_ips: toNumber(row?.unique_ips),
      unique_players: toNumber(row?.unique_players),
    },
  };
}

async function getRateLimit24h(): Promise<{
  total_hits: number;
  unique_ips: number;
  unique_players: number;
}> {
  const now = Date.now();
  if (rateLimitCache && now - rateLimitCache.ts < RATE_LIMIT_TTL_MS) {
    return rateLimitCache.data;
  }
  if (!rateLimitInflight) {
    rateLimitInflight = refreshRateLimit24h().finally(() => {
      rateLimitInflight = null;
    });
  }
  if (rateLimitCache) {
    return rateLimitCache.data;
  }
  await rateLimitInflight;
  return rateLimitCache?.data ?? {
    total_hits: 0,
    unique_ips: 0,
    unique_players: 0,
  };
}

async function refreshRequests24h(): Promise<void> {
  const start = Date.now();
  const { rows } = await query(
    `WITH hours AS (
      SELECT generate_series(
        date_trunc('hour', now()) - interval '23 hours',
        date_trunc('hour', now()),
        interval '1 hour'
      ) AS hr
    ),
    agg AS (
      SELECT date_trunc('hour', bucket_start) AS hr,
        coalesce(sum(hit_count), 0)::bigint AS count
      FROM public.rate_limit_usage
      WHERE bucket_start >= date_trunc('hour', now()) - interval '23 hours'
      GROUP BY date_trunc('hour', bucket_start)
    )
    SELECT h.hr, coalesce(a.count, 0)::bigint AS count
    FROM hours h
    LEFT JOIN agg a ON a.hr = h.hr
    ORDER BY h.hr ASC`,
  );
  console.log(`[admin] overview requests_24h ${Date.now() - start}ms`);
  requestsCache = {
    ts: Date.now(),
    rows: (rows ?? []).map((r: any) => ({
      hr: r.hr,
      count: toNumber(r.count),
    })),
  };
}

async function getRequests24h(): Promise<Array<{ hr: string; count: number }>> {
  const now = Date.now();
  if (requestsCache && now - requestsCache.ts < REQUESTS_TTL_MS) {
    return requestsCache.rows;
  }
  if (!requestsInflight) {
    requestsInflight = refreshRequests24h().finally(() => {
      requestsInflight = null;
    });
  }
  if (requestsCache) {
    return requestsCache.rows;
  }
  await requestsInflight;
  return requestsCache?.rows ?? [];
}

export function registerAdminOverviewRoutes(app: Application): void {
  app.get("/admin/overview", adminAuth, async (_req: Request, res: Response) => {
    const routeStart = Date.now();
    res.on("finish", () => {
      console.log(
        `[admin] overview total ${Date.now() - routeStart}ms status ${res.statusCode}`,
      );
    });
    const timedQuery = async (label: string, text: string) => {
      const start = Date.now();
      try {
        return await query(text);
      } finally {
        console.log(
          `[admin] overview ${label} ${Date.now() - start}ms`,
        );
      }
    };
    try {
      const [
        { rows: [players] },
        { rows: [rooms] },
        { rows: [groups] },
        { rows: [social] },
        { rows: [msgs] },
        { rows: newPlayersSeries },
        rateLimit,
        { rows: recentPlayers },
        { rows: richestPlayers },
        { rows: topRelationships },
        { rows: topTalkers },
        requests24h,
        { rows: recentMessages },
        { rows: recentRequests },
        { rows: recentRooms },
        { rows: recentGroupActivity },
        { rows: recentGroupMessages },
      ] = await Promise.all([
        // 1. Players overview
        timedQuery("players", `
          SELECT
            count(*)::int AS total,
            count(*) FILTER (WHERE has_mod_installed)::int AS with_mod,
            count(*) FILTER (WHERE last_event_at >= now() - interval '5 minutes')::int AS online_5m,
            count(*) FILTER (WHERE last_event_at >= now() - interval '1 hour')::int AS active_1h,
            count(*) FILTER (WHERE last_event_at >= now() - interval '24 hours')::int AS active_24h,
            count(*) FILTER (WHERE last_event_at >= now() - interval '7 days')::int AS active_7d,
            count(*) FILTER (WHERE created_at >= now() - interval '24 hours')::int AS new_24h,
            count(*) FILTER (WHERE created_at >= now() - interval '7 days')::int AS new_7d
          FROM public.players
        `),
        // 2. Rooms overview
        timedQuery("rooms", `
          SELECT
            count(*)::int AS total,
            count(*) FILTER (WHERE NOT is_private)::int AS public,
            count(*) FILTER (WHERE is_private)::int AS private,
            count(*) FILTER (WHERE last_updated_at >= now() - interval '1 hour')::int AS active_1h
          FROM public.rooms
        `),
        // 3. Groups overview
        timedQuery("groups", `
          SELECT
            count(*)::int AS total,
            count(*) FILTER (WHERE created_at >= now() - interval '24 hours')::int AS new_24h,
            count(*) FILTER (WHERE created_at >= now() - interval '7 days')::int AS new_7d,
            count(*) FILTER (WHERE updated_at >= now() - interval '24 hours')::int AS updated_24h
          FROM public.groups
        `),
        // 4. Social overview
        timedQuery("social", `
          SELECT
            count(*) FILTER (WHERE status = 'accepted')::int AS accepted,
            count(*) FILTER (WHERE status = 'pending')::int AS pending,
            count(*) FILTER (WHERE created_at >= now() - interval '24 hours')::int AS new_24h
          FROM public.player_relationships
        `),
        // 5. Messages
        timedQuery("messages", `
          SELECT
            count(*)::int AS total,
            count(*) FILTER (WHERE created_at >= now() - interval '24 hours')::int AS today,
            count(DISTINCT conversation_id)::int AS conversations
          FROM public.direct_messages
        `),
        // 6. New players per day (14 days) - split by mod
        timedQuery("new_players_14d", `
          WITH days AS (
            SELECT generate_series(
              date_trunc('day', now()) - interval '13 days',
              date_trunc('day', now()), interval '1 day'
            ) AS day
          )
          SELECT d.day,
            coalesce(count(p.id), 0)::int AS count,
            coalesce(count(p.id) FILTER (WHERE p.has_mod_installed), 0)::int AS count_mod,
            coalesce(count(p.id) FILTER (WHERE NOT p.has_mod_installed OR p.has_mod_installed IS NULL), 0)::int AS count_no_mod
          FROM days d
          LEFT JOIN public.players p ON date_trunc('day', p.created_at) = d.day
          GROUP BY d.day ORDER BY d.day ASC
        `),
        // 7. Rate limit 24h
        getRateLimit24h(),
        // 10. Recent players
        timedQuery("recent_players", `
          SELECT id, name, avatar_url, has_mod_installed, mod_version, created_at
          FROM public.players ORDER BY created_at DESC LIMIT 10
        `),
        // 11. Richest players
        timedQuery("richest_players", `
          SELECT id, name, avatar_url, coins, has_mod_installed, mod_version
          FROM public.players
          ORDER BY coins DESC NULLS LAST
          LIMIT 10
        `),
        // 12. Most relationships (accepted)
        timedQuery("top_relationships", `
          WITH rels AS (
            SELECT user_one_id AS player_id
            FROM public.player_relationships
            WHERE status = 'accepted'
            UNION ALL
            SELECT user_two_id AS player_id
            FROM public.player_relationships
            WHERE status = 'accepted'
          )
          SELECT p.id, p.name, p.avatar_url, count(*)::int AS rel_count
          FROM rels r
          JOIN public.players p ON p.id = r.player_id
          GROUP BY p.id, p.name, p.avatar_url
          ORDER BY rel_count DESC
          LIMIT 10
        `),
        // 13. Top talkers (messages sent, last 7 days)
        timedQuery("top_talkers", `
          SELECT p.id, p.name, p.avatar_url, count(*)::int AS msg_count
          FROM public.direct_messages dm
          JOIN public.players p ON p.id = dm.sender_id
          WHERE dm.created_at >= now() - interval '7 days'
          GROUP BY p.id, p.name, p.avatar_url
          ORDER BY msg_count DESC
          LIMIT 10
        `),
        // 14. Requests per hour (last 24 hours)
        getRequests24h(),
        // 15. Recent messages
        timedQuery("recent_messages", `
          SELECT dm.id, dm.sender_id, dm.recipient_id, dm.body, dm.created_at,
            ps.name AS sender_name, pr.name AS recipient_name
          FROM public.direct_messages dm
          LEFT JOIN public.players ps ON ps.id = dm.sender_id
          LEFT JOIN public.players pr ON pr.id = dm.recipient_id
          ORDER BY dm.created_at DESC
          LIMIT 10
        `),
        // 16. Recent friend requests (pending + accepted)
        timedQuery("recent_requests", `
          SELECT r.status, r.created_at,
            p1.name AS user_one_name, p1.id AS user_one_id,
            p2.name AS user_two_name, p2.id AS user_two_id
          FROM public.player_relationships r
          LEFT JOIN public.players p1 ON p1.id = r.user_one_id
          LEFT JOIN public.players p2 ON p2.id = r.user_two_id
          WHERE r.status IN ('pending','accepted')
          ORDER BY r.created_at DESC LIMIT 10
        `),
        // 17. Recent rooms (with creator)
        timedQuery("recent_rooms", `
          SELECT r.id, r.is_private, r.players_count, r.created_at,
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
        `),
        // 18. Recent group activity
        timedQuery("recent_group_activity", `
          SELECT ga.id, ga.group_id, ga.group_name, ga.type, ga.actor_id, ga.member_id,
            ga.meta, ga.created_at,
            pa.name AS actor_name,
            pm.name AS member_name
          FROM public.group_activity ga
          LEFT JOIN public.players pa ON pa.id = ga.actor_id
          LEFT JOIN public.players pm ON pm.id = ga.member_id
          ORDER BY ga.created_at DESC
          LIMIT 12
        `),
        // 19. Recent group messages (all groups)
        timedQuery("recent_group_messages", `
          SELECT gm.id, gm.group_id, gm.sender_id, gm.body, gm.created_at,
            g.name AS group_name,
            p.name AS sender_name,
            cnt.member_count
          FROM public.group_messages gm
          LEFT JOIN public.groups g ON g.id = gm.group_id
          LEFT JOIN public.players p ON p.id = gm.sender_id
          LEFT JOIN LATERAL (
            SELECT count(*)::int AS member_count
            FROM public.group_members gm2
            WHERE gm2.group_id = gm.group_id
          ) cnt ON true
          ORDER BY gm.created_at DESC
          LIMIT 10
        `),
      ]);

      res.json({
        ts: new Date().toISOString(),
        players: {
          total: toNumber(players?.total),
          with_mod: toNumber(players?.with_mod),
          online_5m: toNumber(players?.online_5m),
          active_1h: toNumber(players?.active_1h),
          active_24h: toNumber(players?.active_24h),
          active_7d: toNumber(players?.active_7d),
          new_24h: toNumber(players?.new_24h),
          new_7d: toNumber(players?.new_7d),
        },
        rooms: {
          total: toNumber(rooms?.total),
          public: toNumber(rooms?.public),
          private: toNumber(rooms?.private),
          active_1h: toNumber(rooms?.active_1h),
        },
        groups: {
          total: toNumber(groups?.total),
          new_24h: toNumber(groups?.new_24h),
          new_7d: toNumber(groups?.new_7d),
          updated_24h: toNumber(groups?.updated_24h),
        },
        social: {
          accepted: toNumber(social?.accepted),
          pending: toNumber(social?.pending),
          new_24h: toNumber(social?.new_24h),
        },
        messages: {
          total: toNumber(msgs?.total),
          today: toNumber(msgs?.today),
          conversations: toNumber(msgs?.conversations),
        },
        security: {
          rate_limit_24h: {
            total_hits: toNumber(rateLimit?.total_hits),
            unique_ips: toNumber(rateLimit?.unique_ips),
            unique_players: toNumber(rateLimit?.unique_players),
          },
          requests_24h: (requests24h ?? []).map((r: any) => ({
            hour: r.hr,
            count: toNumber(r.count),
          })),
        },
        charts: {
          new_players_14d: (newPlayersSeries ?? []).map((r: any) => ({
            day: r.day,
            count: toNumber(r.count),
            count_mod: toNumber(r.count_mod),
            count_no_mod: toNumber(r.count_no_mod),
          })),
        },
        recent_players: (recentPlayers ?? []).map((r: any) => ({
          id: r.id, name: r.name, avatar_url: r.avatar_url,
          has_mod_installed: !!r.has_mod_installed,
          mod_version: r.mod_version, created_at: r.created_at,
        })),
        recent_messages: (recentMessages ?? []).map((r: any) => ({
          id: r.id,
          sender_id: r.sender_id,
          recipient_id: r.recipient_id,
          body: r.body,
          created_at: r.created_at,
          sender_name: r.sender_name,
          recipient_name: r.recipient_name,
        })),
        recent_requests: (recentRequests ?? []).map((r: any) => ({
          status: r.status,
          created_at: r.created_at,
          user_one_id: r.user_one_id,
          user_one_name: r.user_one_name,
          user_two_id: r.user_two_id,
          user_two_name: r.user_two_name,
        })),
        recent_rooms: (recentRooms ?? []).map((r: any) => ({
          id: r.id,
          is_private: !!r.is_private,
          players_count: toNumber(r.players_count),
          created_at: r.created_at,
          creator_id: r.creator_id,
          creator_name: r.creator_name,
        })),
        recent_group_activity: (recentGroupActivity ?? []).map((r: any) => ({
          id: toNumber(r.id),
          group_id: r.group_id == null ? null : Number(r.group_id),
          group_name: r.group_name,
          type: r.type,
          actor_id: r.actor_id,
          actor_name: r.actor_name,
          member_id: r.member_id,
          member_name: r.member_name,
          meta: r.meta ?? null,
          created_at: r.created_at,
        })),
        recent_group_messages: (recentGroupMessages ?? []).map((r: any) => ({
          id: toNumber(r.id),
          group_id: r.group_id == null ? null : Number(r.group_id),
          group_name: r.group_name,
          sender_id: r.sender_id,
          sender_name: r.sender_name,
          body: r.body,
          created_at: r.created_at,
          member_count: toNumber(r.member_count),
        })),
        richest_players: (richestPlayers ?? []).map((r: any) => ({
          id: r.id, name: r.name, avatar_url: r.avatar_url,
          coins: toNumber(r.coins),
          has_mod_installed: !!r.has_mod_installed,
          mod_version: r.mod_version,
        })),
        top_relationships: (topRelationships ?? []).map((r: any) => ({
          id: r.id, name: r.name, avatar_url: r.avatar_url,
          rel_count: toNumber(r.rel_count),
        })),
        top_talkers: (topTalkers ?? []).map((r: any) => ({
          id: r.id, name: r.name, avatar_url: r.avatar_url,
          msg_count: toNumber(r.msg_count),
        })),
      });
    } catch (err) {
      console.error("[admin] overview error:", err);
      res.status(500).json({ error: "DB error" });
    }
  });
}
