/**
 * Leaderboard Snapshot Update Script
 *
 * Runs every 10 minutes to:
 * 1. Save current ranks to history table
 * 2. Update rankChange (based on oldest available snapshot, max 24h)
 * 3. Clean up snapshots older than 24h
 *
 * This ensures rankChange shows progression over time:
 * - First 3h: compares with 3h ago
 * - After 24h: compares with 24h ago (oldest available)
 *
 * Run via cron: every 10 minutes
 */

import { query } from "../db";

async function updateSnapshots() {
  const startTime = Date.now();
  console.log(`[${new Date().toISOString()}] Starting leaderboard snapshot update...`);

  try {
    // Step 1: Insert current ranks into history
    console.log(`[${new Date().toISOString()}]   → Saving current ranks to history...`);
    const insertResult = await query(
      `
      INSERT INTO public.leaderboard_snapshots_history (player_id, coins_rank, eggs_rank, snapshot_at)
      SELECT
        player_id,
        ROW_NUMBER() OVER (ORDER BY coins DESC, (SELECT created_at FROM players WHERE id = leaderboard_stats.player_id) DESC) as coins_rank,
        ROW_NUMBER() OVER (ORDER BY eggs_hatched DESC, (SELECT created_at FROM players WHERE id = leaderboard_stats.player_id) DESC) as eggs_rank,
        NOW()
      FROM public.leaderboard_stats
      `,
      [],
    );
    console.log(`[${new Date().toISOString()}]   ✓ Inserted ${insertResult.rowCount ?? 0} snapshots`);

    // Step 2: Update leaderboard_stats with oldest snapshot ranks (for rankChange calculation)
    console.log(`[${new Date().toISOString()}]   → Updating rankChange references...`);
    const updateResult = await query(
      `
      UPDATE public.leaderboard_stats ls
      SET
        coins_rank_snapshot_24h = oldest.coins_rank,
        eggs_rank_snapshot_24h = oldest.eggs_rank,
        snapshot_24h_at = oldest.snapshot_at
      FROM (
        SELECT DISTINCT ON (player_id)
          player_id,
          coins_rank,
          eggs_rank,
          snapshot_at
        FROM public.leaderboard_snapshots_history
        WHERE snapshot_at >= NOW() - INTERVAL '24 hours'
        ORDER BY player_id, snapshot_at ASC
      ) oldest
      WHERE ls.player_id = oldest.player_id
      `,
      [],
    );
    console.log(`[${new Date().toISOString()}]   ✓ Updated ${updateResult.rowCount ?? 0} players`);

    // Step 3: Delete snapshots older than 24h
    console.log(`[${new Date().toISOString()}]   → Cleaning up old snapshots...`);
    const deleteResult = await query(
      `
      DELETE FROM public.leaderboard_snapshots_history
      WHERE snapshot_at < NOW() - INTERVAL '24 hours'
      `,
      [],
    );
    console.log(`[${new Date().toISOString()}]   ✓ Deleted ${deleteResult.rowCount ?? 0} old snapshots`);

    const duration = Date.now() - startTime;
    console.log(`[${new Date().toISOString()}] ✓ Snapshot update completed in ${duration}ms`);
  } catch (err) {
    console.error(`[${new Date().toISOString()}] ✗ Snapshot update failed:`, err);
    process.exit(1);
  }

  process.exit(0);
}

updateSnapshots();
