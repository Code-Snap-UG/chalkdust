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

echo "Importing $DUMP_FILE into local database..."
echo "Target: $DATABASE_URL"

psql "$DATABASE_URL" -f "$DUMP_FILE"

echo "Import complete."
