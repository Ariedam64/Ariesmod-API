/**
 * Leaderboard Snapshot Update Script
 *
 * Runs every 30 minutes to:
 * 1. Recalculate and store current ranks
 * 2. Reset snapshot reference for players whose snapshot is older than 24h
 *
 * No history table needed — snapshot columns in leaderboard_stats are
 * refreshed in-place when they expire (>24h old).
 *
 * Run via cron: every 30 minutes
 */

import { query } from "../db";

async function updateSnapshots() {
  const startTime = Date.now();
  console.log(`[${new Date().toISOString()}] Starting leaderboard snapshot update...`);

  try {
    // Step 1: Calculate and store ranks in leaderboard_stats
    console.log(`[${new Date().toISOString()}]   → Calculating and storing ranks...`);
    await query(
      `
      WITH coins_ranked AS (
        SELECT
          ls.player_id,
          ROW_NUMBER() OVER (ORDER BY ls.coins DESC, p.created_at DESC) as rank
        FROM public.leaderboard_stats ls
        JOIN public.players p ON p.id = ls.player_id
        WHERE ls.coins > 0
      ),
      eggs_ranked AS (
        SELECT
          ls.player_id,
          ROW_NUMBER() OVER (ORDER BY ls.eggs_hatched DESC, p.created_at DESC) as rank
        FROM public.leaderboard_stats ls
        JOIN public.players p ON p.id = ls.player_id
        WHERE ls.eggs_hatched > 0
      ),
      all_players AS (
        SELECT player_id FROM public.leaderboard_stats
      )
      UPDATE public.leaderboard_stats ls
      SET
        coins_rank = cr.rank,
        eggs_rank = er.rank
      FROM all_players ap
      LEFT JOIN coins_ranked cr ON cr.player_id = ap.player_id
      LEFT JOIN eggs_ranked er ON er.player_id = ap.player_id
      WHERE ls.player_id = ap.player_id
      `,
      [],
    );
    console.log(`[${new Date().toISOString()}]   ✓ Ranks calculated and stored`);

    // Step 2: Reset snapshot for players whose reference is expired or missing
    // When expired, current rank becomes the new reference point
    console.log(`[${new Date().toISOString()}]   → Resetting expired snapshots...`);
    const updateResult = await query(
      `
      UPDATE public.leaderboard_stats
      SET
        coins_rank_snapshot_24h = coins_rank,
        eggs_rank_snapshot_24h = eggs_rank,
        snapshot_24h_at = NOW()
      WHERE snapshot_24h_at IS NULL
        OR snapshot_24h_at < NOW() - INTERVAL '24 hours'
      `,
      [],
    );
    console.log(`[${new Date().toISOString()}]   ✓ Reset ${updateResult.rowCount ?? 0} expired snapshots`);

    const duration = Date.now() - startTime;
    console.log(`[${new Date().toISOString()}] ✓ Snapshot update completed in ${duration}ms`);
  } catch (err) {
    console.error(`[${new Date().toISOString()}] ✗ Snapshot update failed:`, err);
    process.exit(1);
  }

  process.exit(0);
}

updateSnapshots();
