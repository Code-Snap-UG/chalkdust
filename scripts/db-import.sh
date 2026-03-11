#!/usr/bin/env bash
set -euo pipefail

# Load .env.local
if [ -f "$(dirname "$0")/../.env.local" ]; then
  set -o allexport
  # shellcheck disable=SC1091
  source "$(dirname "$0")/../.env.local"
  set +o allexport
fi

: "${DATABASE_URL:?DATABASE_URL not set in .env.local}"

DUMP_DIR="$(dirname "$0")/../dumps"

# Allow passing a specific file as first arg, otherwise use the latest
if [ -n "${1:-}" ]; then
  DUMP_FILE="$1"
else
  DUMP_FILE=$(ls -t "$DUMP_DIR"/*.sql 2>/dev/null | head -n1)
  if [ -z "$DUMP_FILE" ]; then
    echo "No dump files found in $DUMP_DIR. Run 'npm run db-dump' first."
    exit 1
  fi
fi

# Extract DB name and base URL (strip trailing /dbname and query params)
DB_NAME=$(echo "$DATABASE_URL" | sed 's|.*\/||' | sed 's|?.*||')
BASE_URL=$(echo "$DATABASE_URL" | sed "s|/${DB_NAME}.*||")

echo "Resetting local database '$DB_NAME'..."
psql "${BASE_URL}/postgres" -c "DROP DATABASE IF EXISTS \"${DB_NAME}\" WITH (FORCE);"
psql "${BASE_URL}/postgres" -c "CREATE DATABASE \"${DB_NAME}\";"

echo "Importing $DUMP_FILE..."
psql "$DATABASE_URL" -f "$DUMP_FILE"

echo "Import complete."
