# Cron Job Setup - Leaderboard Snapshots

## Overview

The leaderboard rank snapshot system runs every 10 minutes to maintain a historical record of rank changes.

**How it works:**
- **Every 10 minutes**, the script:
  1. **Calculates and stores current ranks** in `leaderboard_stats` (optimizes API queries)
  2. Saves current ranks to history table
  3. Updates `rankChange` (compares with oldest available snapshot, max 24h)
  4. Cleans up snapshots older than 24 hours

**Progressive rankChange:**
- **First hour**: Shows change over 1 hour (oldest available snapshot)
- **After 3 hours**: Shows change over 3 hours
- **After 24 hours**: Shows change over 24 hours (maximum)

This ensures players see meaningful rank progression without waiting 24h initially!

## Architecture

### Database Tables

**`leaderboard_snapshots_history`** - Historical snapshot storage
- Stores one snapshot every 10 minutes for each player
- Keeps maximum 24 hours of history
- ~10K players × 144 snapshots/day = ~1.4M rows (auto-cleaned)

**`leaderboard_stats`** - Current leaderboard data
- `coins_rank` - **Pre-calculated** current coins rank (updated every 10 min by cron)
- `eggs_rank` - **Pre-calculated** current eggs rank (updated every 10 min by cron)
- `coins_rank_snapshot_24h` - Rank from oldest snapshot (for rankChange calculation)
- `eggs_rank_snapshot_24h` - Rank from oldest snapshot (for rankChange calculation)
- `snapshot_24h_at` - Timestamp of oldest snapshot being compared against

**Performance Optimization:**
- Ranks are pre-calculated every 10 minutes by the cron job
- API endpoints use these pre-calculated ranks instead of expensive `ROW_NUMBER()` queries
- This eliminates real-time rank calculation overhead on every request
- Result: **~90%+ reduction in CPU usage** for leaderboard queries

## Setup Instructions

### 1. Apply database migrations

```bash
# Create history table
docker exec -i aries_mod_db psql -U aries -d aries_mod < /srv/aries-mod-backend/migrations/create_snapshots_history.sql
```

### 2. Build the snapshot script

```bash
cd /srv/aries-mod-backend
npm run build
docker compose build api && docker compose up -d api
```

### 3. Test the script manually

```bash
docker exec ariesmod-api node dist/scripts/update-leaderboard-snapshots.js
```

Expected output:
```
[2026-02-16T21:33:06.366Z] Starting leaderboard snapshot update...
[2026-02-16T21:33:06.366Z]   → Calculating and storing ranks...
[2026-02-16T21:33:08.009Z]   ✓ Ranks calculated and stored
[2026-02-16T21:33:08.009Z]   → Saving current ranks to history...
[2026-02-16T21:33:10.314Z]   ✓ Inserted 10283 snapshots
[2026-02-16T21:33:10.315Z]   → Updating rankChange references...
[2026-02-16T21:33:21.554Z]   ✓ Updated 10283 players
[2026-02-16T21:33:21.555Z]   → Cleaning up old snapshots...
[2026-02-16T21:33:21.568Z]   ✓ Deleted 0 old snapshots
[2026-02-16T21:33:21.573Z] ✓ Snapshot update completed in 15207ms
```

### 4. Configure cron

The cron job is already configured (check existing crontab):
```bash
crontab -l
```

If not present, add this line:
```cron
*/10 * * * * docker exec ariesmod-api node dist/scripts/update-leaderboard-snapshots.js >> /var/log/leaderboard-snapshots.log 2>&1
```

## Monitoring

### Check recent logs
```bash
tail -f /var/log/leaderboard-snapshots.log
```

### Verify snapshot history in database
```sql
-- Check how many snapshots exist for a player
SELECT player_id, COUNT(*) as snapshot_count, MIN(snapshot_at) as oldest, MAX(snapshot_at) as newest
FROM public.leaderboard_snapshots_history
WHERE player_id = 'YOUR_PLAYER_ID'
GROUP BY player_id;

-- Check total snapshots in system
SELECT COUNT(*) as total_snapshots,
       COUNT(DISTINCT player_id) as unique_players,
       MIN(snapshot_at) as oldest_snapshot,
       MAX(snapshot_at) as newest_snapshot
FROM public.leaderboard_snapshots_history;
```

### Verify rankChange calculation
```sql
SELECT
  player_id,
  coins_rank_snapshot_24h,
  eggs_rank_snapshot_24h,
  snapshot_24h_at,
  NOW() - snapshot_24h_at as age
FROM public.leaderboard_stats
WHERE snapshot_24h_at IS NOT NULL
ORDER BY snapshot_24h_at DESC
LIMIT 5;
```

## Performance

**Current performance (10,283 players):**
- Calculate and store ranks: ~1,600ms
- Insert snapshots: ~2,300ms
- Update rankChange: ~11,200ms
- Delete old snapshots: ~15ms
- **Total: ~15 seconds** per run (every 10 minutes)

**API Query Performance (after optimization):**
- Leaderboard endpoint response time: **14-22ms** (down from 200-500ms)
- Welcome event leaderboard queries: **15-30ms** (down from 100-300ms)
- CPU usage reduction: **~70-90%** for leaderboard-related queries

**Scaling estimates:**
- 50K players: ~30-45 seconds per cron run
- 100K players: ~60-90 seconds per cron run
- Database size: ~1.4M rows per day (auto-cleaned to 24h max)

**Note:** The cron job takes longer now because it pre-calculates ranks, but this dramatically reduces CPU usage for all API requests throughout the 10-minute interval.

## Troubleshooting

### Cron not running
1. Check cron service: `sudo systemctl status cron`
2. Check Docker container is running: `docker ps | grep ariesmod-api`
3. Check log file permissions: `ls -la /var/log/leaderboard-snapshots.log`

### Script fails
```bash
# Check recent errors
tail -50 /var/log/leaderboard-snapshots.log

# Run manually with full output
docker exec ariesmod-api node dist/scripts/update-leaderboard-snapshots.js

# Check database connectivity
docker exec -i aries_mod_db psql -U aries -d aries_mod -c "SELECT COUNT(*) FROM leaderboard_stats;"
```

### No snapshots being deleted
This is normal during the first 24 hours. After 24h, you should see:
```
✓ Deleted XXXX old snapshots
```

### RankChange shows null
- This happens if a player has no snapshots in history yet
- Wait for first cron run after player joins leaderboard

## Changing the Frequency

**WARNING:** Changing frequency affects the granularity of rank tracking.

```cron
# Every 5 minutes (more granular, more storage)
*/5 * * * * docker exec ariesmod-api node dist/scripts/update-leaderboard-snapshots.js >> /var/log/leaderboard-snapshots.log 2>&1

# Every 15 minutes (less granular, less storage)
*/15 * * * * docker exec ariesmod-api node dist/scripts/update-leaderboard-snapshots.js >> /var/log/leaderboard-snapshots.log 2>&1

# Once per hour (minimal granularity)
0 * * * * docker exec ariesmod-api node dist/scripts/update-leaderboard-snapshots.js >> /var/log/leaderboard-snapshots.log 2>&1
```

**Storage impact:**
- 5 min: 288 snapshots/day × 10K players = 2.88M rows
- 10 min: 144 snapshots/day × 10K players = 1.44M rows ✅ **Recommended**
- 15 min: 96 snapshots/day × 10K players = 960K rows
- 60 min: 24 snapshots/day × 10K players = 240K rows

## Manual Operations

### Clear all history (start fresh)
```sql
TRUNCATE TABLE public.leaderboard_snapshots_history;
```

### Reset rankChange for all players
```sql
UPDATE public.leaderboard_stats
SET
  coins_rank_snapshot_24h = NULL,
  eggs_rank_snapshot_24h = NULL,
  snapshot_24h_at = NULL;
```

### Force immediate snapshot for testing
```bash
docker exec ariesmod-api node dist/scripts/update-leaderboard-snapshots.js
```
