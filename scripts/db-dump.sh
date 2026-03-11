#!/usr/bin/env bash
set -euo pipefail

# Load .env.local
if [ -f "$(dirname "$0")/../.env.local" ]; then
  set -o allexport
  # shellcheck disable=SC1091
  source "$(dirname "$0")/../.env.local"
  set +o allexport
fi

: "${DB_POSTGRES_HOST:?DB_POSTGRES_HOST not set in .env.local}"
: "${DB_POSTGRES_USER:?DB_POSTGRES_USER not set in .env.local}"
: "${DB_POSTGRES_PASSWORD:?DB_POSTGRES_PASSWORD not set in .env.local}"
: "${DB_POSTGRES_DATABASE:?DB_POSTGRES_DATABASE not set in .env.local}"

DUMP_DIR="$(dirname "$0")/../dumps"
mkdir -p "$DUMP_DIR"

TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
OUTPUT_FILE="$DUMP_DIR/${TIMESTAMP}.sql"

echo "Dumping from ${DB_POSTGRES_HOST}/${DB_POSTGRES_DATABASE}..."

PGPASSWORD="$DB_POSTGRES_PASSWORD" pg_dump \
  --host="$DB_POSTGRES_HOST" \
  --port=5432 \
  --username="$DB_POSTGRES_USER" \
  --dbname="$DB_POSTGRES_DATABASE" \
  --no-owner \
  --no-acl \
  --no-privileges \
  --format=plain \
  --file="$OUTPUT_FILE"

echo "Dump saved to: $OUTPUT_FILE"
