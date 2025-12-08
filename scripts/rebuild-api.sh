#!/usr/bin/env bash
set -e

# Aller à la racine du projet (scripts/ -> ..)
cd "$(dirname "$0")/.."

echo "🔧 Building TypeScript..."
npm run build

echo "🐳 Building Docker image (api)..."
docker compose build api

echo "🚀 Restarting api container..."
docker compose up -d api

echo "✅ Done."
