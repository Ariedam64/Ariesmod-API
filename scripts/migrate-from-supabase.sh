#!/usr/bin/env bash
set -euo pipefail

# Racine du projet (scripts/ -> ..)
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "📦 Migration depuis Supabase vers aries_mod (Docker Postgres)..."

# -----------------------------
# 1) DSN Supabase
# -----------------------------
# Tu DOIS définir la variable d'env SUPABASE_DSN avant d'exécuter ce script, par ex :
# export SUPABASE_DSN='postgresql://postgres:TON_MDP_SUPABASE@db.pquktqrngyxkvrgtfygp.supabase.co:5432/postgres?sslmode=require'

if [ "${SUPABASE_DSN:-}" = "" ]; then
  echo "❌ Variable d'environnement SUPABASE_DSN non définie."
  echo "   Exemple :"
  echo "   export SUPABASE_DSN='postgresql://postgres:TON_MDP_SUPABASE@db.pquktqrngyxkvrgtfygp.supabase.co:5432/postgres?sslmode=require'"
  exit 1
fi

# -----------------------------
# 2) Dump depuis Supabase
# -----------------------------
echo "🔄 Dump des données Supabase vers supabase_data.sql..."

docker run --rm --network host -v "${PROJECT_ROOT}":/dump postgres:17 \
  pg_dump \
    --data-only \
    --inserts \
    --no-owner \
    --no-privileges \
    --dbname "${SUPABASE_DSN}" \
    --table public.players \
    --table public.player_state \
    --table public.player_privacy \
    --table public.rooms \
    --table public.room_players \
    --table public.player_relationships \
    --table public.blocked_ips \
    -f /dump/supabase_data.sql

echo "✅ Dump terminé: ${PROJECT_ROOT}/supabase_data.sql"

# -----------------------------
# 3) Truncate des tables locales
# -----------------------------
echo "🧨 TRUNCATE des tables locales (aries_mod_db / aries_mod)..."

docker exec aries_mod_db psql -U aries -d aries_mod -v ON_ERROR_STOP=1 -c "
TRUNCATE TABLE
  public.rate_limit_usage,
  public.blocked_ips,
  public.room_players,
  public.player_relationships,
  public.rooms,
  public.player_state,
  public.player_privacy,
  public.players
RESTART IDENTITY;
"

echo "✅ Tables vidées."

# -----------------------------
# 4) Import du dump dans la DB locale
# -----------------------------
echo "📥 Import de supabase_data.sql dans aries_mod..."

docker exec -i aries_mod_db psql -U aries -d aries_mod < supabase_data.sql

echo "✅ Import terminé."
echo "🎉 Migration Supabase -> aries_mod terminée proprement."
