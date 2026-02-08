# Arie's Mod Backend

Express + PostgreSQL API for Arie's mod. It ingests player state from the game client, keeps room listings fresh, exposes player and friends views, and ships a small admin console for read-only data inspection.

## Tech Stack
- Node.js 20 / TypeScript compiled to CommonJS
- Express 5, pg
- PostgreSQL (see `schema.sql` + `migrations/002_indexes.sql`)
- Docker/Docker Compose for local development

## API Overview
- `GET /health` – liveness probe.
- `POST /collect-state` – upserts player profile, privacy, state (garden, inventory, stats, activity log, journal) and current room; rate limited via `public.check_rate_limit`.
- `GET /rooms?limit=` – lists recent public rooms; lazily prunes stale rows.
- Friends
  - `POST /friend-request` – create a pending request.
  - `POST /friend-respond` – accept or reject a request.
  - `POST /friend-remove` – delete an accepted friendship.
  - `GET /list-friend-requests?playerId=` – incoming/outgoing pending requests.
  - `GET /list-friends?playerId=` – accepted friendships.
  - `GET /friend-requests/stream?playerId=` – SSE stream for real-time requests.
- Messages
  - `POST /messages/send` – send a DM (friends only).
  - `GET /messages/thread?playerId=&otherPlayerId=` – message history.
  - `POST /messages/read` – mark messages as read (batch).
  - `GET /messages/stream?playerId=` – SSE stream for realtime updates.
- Player views
  - `GET /get-player-view?playerId=&sections=` – detailed view for one player with optional section filtering.
  - `POST /get-players-view` – batched player views; accepts `{ playerIds, sections }`.
  - `GET /list-mod-players?query=&limit=&offset=` – list players with the mod installed (optional name/id search).
- Admin (HTTP Basic auth with `ADMIN_USER` / `ADMIN_PASS`)
  - `GET /admin` – static admin UI.
  - `GET /admin/table?table=` – paged reads over real tables or derived stats.
  - `POST /admin/sql` – read-only SQL console (SELECT-only guardrails).
  - `POST /admin/form/player-lookup` – profile + state + rate-limit summary lookup.
  - `POST /admin/form/player-friends` – relationships for a player.
  - `POST /admin/form/rate-limit-player` – rate-limit history filtered by player/IP.

## Environment
Create a `.env` with:
```
DATABASE_URL=postgres://user:pass@host:5432/dbname
PORT=4000
ADMIN_USER=admin
ADMIN_PASS=changeme
```

## Database Setup
1) Apply schema and functions: `psql "$DATABASE_URL" -f schema.sql`  
2) Apply indexes: `psql "$DATABASE_URL" -f migrations/002_indexes.sql`  
3) Apply latest migrations: `psql "$DATABASE_URL" -f migrations/004_messages.sql`
4) Apply latest migrations: `psql "$DATABASE_URL" -f migrations/005_player_avatar.sql`
3) (Optional) `migrations/supabase_data.sql` contains sample data for local testing.

Rate limiting depends on the `public.check_rate_limit` function and the `rate_limit_usage` table defined in `schema.sql`.

## Running Locally
```
npm install
npm run dev
# API on http://localhost:4000
```

Build + start from compiled output:
```
npm run build
npm start
```

With Docker Compose (brings up Postgres + API):
```
docker compose up -d --build
```
Use `scripts/rebuild-api.sh` to rebuild and restart the API container.

## Project Structure
- `src/` – Express app, routes, DB connector, helpers.
- `schema.sql` – canonical database schema and rate-limit function.
- `migrations/002_indexes.sql` – performance indexes for core queries.
- `Dockerfile`, `docker-compose.yml` – containerized runtime/dev environment.
- `scripts/rebuild-api.sh` – helper to rebuild the API image and restart it.
