import type { Application, Request, Response } from "express";
import { query } from "../../db";
import { adminAuth } from "./common";

function toNumber(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return n;
}

export function registerAdminOverviewRoutes(app: Application): void {
  app.get("/admin/overview", adminAuth, async (_req: Request, res: Response) => {
    const ONLINE_WINDOW_MINUTES = 5;
    const ROOM_ACTIVE_WINDOW_MINUTES = 60;
    const RATE_LIMIT_WINDOW_HOURS = 24;

    try {
      const [
        { rows: [playersRow] },
        { rows: [roomsRow] },
        { rows: topRooms },
        { rows: [socialRow] },
        { rows: topConnectors },
        { rows: [blockedRow] },
        { rows: [rateLimitAggRow] },
        { rows: [rateLimitTopIpRow] },
        { rows: [rateLimitTopPlayerRow] },
        { rows: rateLimitHourly },
        { rows: [momentumRow] },
        { rows: [economyRow] },
        { rows: topRich },
        { rows: [privacyRow] },
        { rows: momentumSeries },
      ] = await Promise.all([
        query(`
          select
            count(*)::integer as total,
            sum((has_mod_installed)::int)::integer as with_mod,
            sum((last_event_at >= now() - interval '${ONLINE_WINDOW_MINUTES} minutes')::int)::integer as online
          from public.players
        `),
        query(`
          select
            count(*)::integer as total,
            sum((is_private = false)::int)::integer as public_count,
            sum((is_private = true)::int)::integer as private_count,
            sum((last_updated_at >= now() - interval '${ROOM_ACTIVE_WINDOW_MINUTES} minutes')::int)::integer as active_recent
          from public.rooms
        `),
        query(`
          select
            r.id,
            r.is_private,
            r.players_count,
            r.created_at,
            r.last_updated_at,
            extract(epoch from (now() - r.created_at)) / 3600 as age_hours,
            p_now.players as current_players
          from public.rooms r
          left join lateral (
            select json_agg(json_build_object(
              'id', p.id,
              'name', p.name,
              'avatar_url', p.avatar_url
            ) order by rp.joined_at desc) as players
            from (
              select rp.player_id, rp.joined_at
              from public.room_players rp
              where rp.room_id = r.id
                and rp.left_at is null
              order by rp.joined_at desc
              limit 6
            ) rp
            join public.players p on p.id = rp.player_id
          ) p_now on true
          order by r.created_at asc
          limit 5
        `),
        query(`
          select
            count(*)::integer as total,
            sum((status = 'accepted')::int)::integer as accepted,
            sum((status = 'pending')::int)::integer as pending,
            sum((status = 'rejected')::int)::integer as rejected
          from public.player_relationships
        `),
        query(`
          with rel as (
            select user_one_id as player_id, status from public.player_relationships
            union all
            select user_two_id as player_id, status from public.player_relationships
          )
          , agg as (
            select
              player_id,
              count(*)::integer as total_relations,
              sum((status = 'accepted')::int)::integer as accepted,
              sum((status = 'pending')::int)::integer as pending
            from rel
            group by player_id
          )
          select
            a.player_id,
            a.total_relations,
            a.accepted,
            a.pending,
            p.name,
            p.avatar_url
          from agg a
          left join public.players p on p.id = a.player_id
          order by a.total_relations desc, a.accepted desc
          limit 10
        `),
        query(`select count(*)::integer as blocked_ips from public.blocked_ips`),
        query(`
          select
            coalesce(sum(hit_count), 0) as total_hits,
            max(hit_count) as max_bucket_hits,
            max(bucket_start) as last_bucket
          from public.rate_limit_usage
          where bucket_start >= now() - interval '${RATE_LIMIT_WINDOW_HOURS} hours'
        `),
        query(`
          select ip, sum(hit_count) as hits
          from public.rate_limit_usage
          where bucket_start >= now() - interval '${RATE_LIMIT_WINDOW_HOURS} hours'
            and ip is not null
          group by ip
          order by hits desc
          limit 1
        `),
        query(`
          select player_id, sum(hit_count) as hits
          from public.rate_limit_usage
          where bucket_start >= now() - interval '${RATE_LIMIT_WINDOW_HOURS} hours'
            and player_id is not null
          group by player_id
          order by hits desc
          limit 1
        `),
        query(`
          with series as (
            select generate_series(
              date_trunc('hour', now() - interval '${RATE_LIMIT_WINDOW_HOURS - 1} hours'),
              date_trunc('hour', now()),
              interval '1 hour'
            ) as bucket
          )
          select
            s.bucket as hour,
            coalesce(sum(r.hit_count), 0) as hits
          from series s
          left join public.rate_limit_usage r
            on date_trunc('hour', r.bucket_start) = s.bucket
          group by s.bucket
          order by s.bucket asc
        `),
        query(`
          select
            sum((created_at >= now() - interval '24 hours')::int)::integer as new_24h,
            sum((created_at >= now() - interval '7 days')::int)::integer as new_7d,
            sum((last_event_at >= now() - interval '24 hours')::int)::integer as active_24h,
            sum((last_event_at >= now() - interval '7 days')::int)::integer as active_7d
          from public.players
        `),
        query(`
          select
            sum(coins)::bigint as total_coins,
            avg(coins)::float as avg_coins,
            percentile_cont(0.5) within group (order by coins)::float as p50,
            percentile_cont(0.9) within group (order by coins)::float as p90,
            percentile_cont(0.99) within group (order by coins)::float as p99
          from public.players
        `),
        query(`
          select id, name, avatar_url, coins
          from public.players
          order by coins desc nulls last
          limit 5
        `),
        query(`
          select
            count(*)::integer as total,
            sum((show_profile = true)::int)::integer as show_profile_true,
            sum((show_garden = true)::int)::integer as show_garden_true,
            sum((show_inventory = true)::int)::integer as show_inventory_true,
            sum((show_coins = true)::int)::integer as show_coins_true,
            sum((show_activity_log = true)::int)::integer as show_activity_log_true,
            sum((hide_room_from_public_list = true)::int)::integer as hide_room_true,
            sum((show_journal = true)::int)::integer as show_journal_true,
            sum((show_stats = true)::int)::integer as show_stats_true
          from public.player_privacy
        `),
        query(`
          with days as (
            select generate_series(
              date_trunc('day', now()) - interval '6 days',
              date_trunc('day', now()),
              interval '1 day'
            ) as day
          ),
          stats as (
            select date_trunc('day', created_at) as day, has_mod_installed, count(*)::integer as cnt
            from public.players
            where created_at >= date_trunc('day', now()) - interval '6 days'
            group by 1, 2
          )
          select
            d.day,
            coalesce(sum(case when s.has_mod_installed then s.cnt end), 0)::integer as with_mod,
            coalesce(sum(case when not s.has_mod_installed then s.cnt end), 0)::integer as without_mod
          from days d
          left join stats s on s.day = d.day
          group by d.day
          order by d.day asc
        `),
      ]);

      res.json({
        generated_at: new Date().toISOString(),
        players: {
          total: toNumber(playersRow?.total),
          with_mod: toNumber(playersRow?.with_mod),
          online: toNumber(playersRow?.online),
          online_window_minutes: ONLINE_WINDOW_MINUTES,
        },
        rooms: {
          total: toNumber(roomsRow?.total),
          public: toNumber(roomsRow?.public_count),
          private: toNumber(roomsRow?.private_count),
          active_recent: toNumber(roomsRow?.active_recent),
          active_window_minutes: ROOM_ACTIVE_WINDOW_MINUTES,
          top: (topRooms ?? []).map((row: any) => ({
            id: row.id,
            is_private: !!row.is_private,
            players_count: toNumber(row.players_count),
            created_at: row.created_at,
            last_updated_at: row.last_updated_at,
            age_hours: toNumber(row.age_hours),
            players: Array.isArray(row.current_players) ? row.current_players : [],
          })),
        },
        social: {
          total: toNumber(socialRow?.total),
          accepted: toNumber(socialRow?.accepted),
          pending: toNumber(socialRow?.pending),
          rejected: toNumber(socialRow?.rejected),
          top_connectors: (topConnectors ?? []).map((row: any) => ({
            player_id: row.player_id,
            total_relations: toNumber(row.total_relations),
            accepted: toNumber(row.accepted),
            pending: toNumber(row.pending),
            name: row.name,
            avatar_url: row.avatar_url,
          })),
        },
        security: {
          blocked_ips: toNumber(blockedRow?.blocked_ips),
          rate_limit: {
            window_hours: RATE_LIMIT_WINDOW_HOURS,
            total_hits: toNumber(rateLimitAggRow?.total_hits),
            max_bucket_hits: toNumber(rateLimitAggRow?.max_bucket_hits),
            last_bucket: rateLimitAggRow?.last_bucket ?? null,
            top_ip: rateLimitTopIpRow?.ip
              ? { ip: rateLimitTopIpRow.ip, hits: toNumber(rateLimitTopIpRow.hits) }
              : null,
            top_player: rateLimitTopPlayerRow?.player_id
              ? { player_id: rateLimitTopPlayerRow.player_id, hits: toNumber(rateLimitTopPlayerRow.hits) }
              : null,
            hourly: (rateLimitHourly ?? []).map((row: any) => ({
              hour: row.hour,
              hits: toNumber(row.hits),
            })),
          },
        },
        momentum: {
          new_24h: toNumber(momentumRow?.new_24h),
          new_7d: toNumber(momentumRow?.new_7d),
          active_24h: toNumber(momentumRow?.active_24h),
          active_7d: toNumber(momentumRow?.active_7d),
          series_7d: (momentumSeries ?? []).map((row: any) => ({
            day: row.day,
            with_mod: toNumber(row.with_mod),
            without_mod: toNumber(row.without_mod),
          })),
        },
        economy: {
          total_coins: toNumber(economyRow?.total_coins),
          avg_coins: toNumber(economyRow?.avg_coins),
          p50: toNumber(economyRow?.p50),
          p90: toNumber(economyRow?.p90),
          p99: toNumber(economyRow?.p99),
          top: (topRich ?? []).map((row: any) => ({
            player_id: row.id,
            name: row.name,
            avatar_url: row.avatar_url,
            coins: toNumber(row.coins),
          })),
        },
        privacy: {
          total: toNumber(privacyRow?.total),
          show_profile_true: toNumber(privacyRow?.show_profile_true),
          show_garden_true: toNumber(privacyRow?.show_garden_true),
          show_inventory_true: toNumber(privacyRow?.show_inventory_true),
          show_coins_true: toNumber(privacyRow?.show_coins_true),
          show_activity_log_true: toNumber(privacyRow?.show_activity_log_true),
          hide_room_true: toNumber(privacyRow?.hide_room_true),
          show_journal_true: toNumber(privacyRow?.show_journal_true),
          show_stats_true: toNumber(privacyRow?.show_stats_true),
        },
      });
    } catch (err) {
      console.error("[admin] overview error:", err);
      res.status(500).json({ error: "DB error" });
    }
  });
}
