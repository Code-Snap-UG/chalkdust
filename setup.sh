#!/usr/bin/env bash
set -euo pipefail

# ─── Colors & helpers ────────────────────────────────────────────────────────

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

info()    { printf "${CYAN}ℹ ${NC}%s\n" "$*"; }
success() { printf "${GREEN}✔ ${NC}%s\n" "$*"; }
warn()    { printf "${YELLOW}⚠ ${NC}%s\n" "$*"; }
error()   { printf "${RED}✖ ${NC}%s\n" "$*"; exit 1; }
header()  { printf "\n${BOLD}── %s ──${NC}\n\n" "$*"; }

ask() {
  local prompt="$1" default="${2:-}"
  if [[ -n "$default" ]]; then
    printf "${BOLD}%s${NC} [%s]: " "$prompt" "$default"
  else
    printf "${BOLD}%s${NC}: " "$prompt"
  fi
  read -r answer
  echo "${answer:-$default}"
}

ask_secret() {
  local prompt="$1"
  printf "${BOLD}%s${NC}: " "$prompt"
  read -rs answer
  echo
  echo "$answer"
}

confirm() {
  local prompt="$1" default="${2:-y}"
  if [[ "$default" == "y" ]]; then
    printf "${BOLD}%s${NC} [Y/n]: " "$prompt"
  else
    printf "${BOLD}%s${NC} [y/N]: " "$prompt"
  fi
  read -r answer
  answer="$(echo "${answer:-$default}" | tr '[:upper:]' '[:lower:]')"
  [[ "$answer" == "y" || "$answer" == "yes" ]]
}

# ─── Banner ──────────────────────────────────────────────────────────────────

clear
printf "${BOLD}${CYAN}"
cat << 'BANNER'

   _____ _           _ _       _           _
  / ____| |         | | |     | |         | |
 | |    | |__   __ _| | | ____| |_   _ ___| |_
 | |    | '_ \ / _` | | |/ / _` | | | / __| __|
 | |____| | | | (_| | |   < (_| | |_| \__ \ |_
  \_____|_| |_|\__,_|_|_|\_\__,_|\__,_|___/\__|

  Local Development Setup
BANNER
printf "${NC}\n"

# ─── 1. Check prerequisites ─────────────────────────────────────────────────

header "Checking prerequisites"

# Node.js
if command -v node &>/dev/null; then
  NODE_VERSION=$(node -v | sed 's/v//')
  NODE_MAJOR=$(echo "$NODE_VERSION" | cut -d. -f1)
  if (( NODE_MAJOR >= 20 )); then
    success "Node.js $NODE_VERSION"
  else
    error "Node.js 20+ is required (found $NODE_VERSION). Please upgrade: https://nodejs.org/"
  fi
else
  error "Node.js is not installed. Please install Node.js 20+: https://nodejs.org/"
fi

# npm
if command -v npm &>/dev/null; then
  success "npm $(npm -v)"
else
  error "npm is not installed."
fi

# Docker (preferred for PostgreSQL)
DOCKER_AVAILABLE=false
if command -v docker &>/dev/null && docker info &>/dev/null 2>&1; then
  DOCKER_AVAILABLE=true
  success "Docker $(docker --version | sed 's/[^0-9]*\([0-9][0-9]*\.[0-9][0-9]*\.[0-9][0-9]*\).*/\1/')"
else
  warn "Docker is not available. Will check for a local PostgreSQL installation instead."
fi

# ─── 2. PostgreSQL setup ────────────────────────────────────────────────────

header "PostgreSQL setup"

CONTAINER_NAME="chalkdust-db"
DB_NAME="chalkdust"
DB_USER="postgres"
DB_PASSWORD="postgres"
DB_HOST="localhost"
DB_PORT="5432"

USE_DOCKER=false
SKIP_DB_SETUP=false

if [[ "$DOCKER_AVAILABLE" == true ]]; then
  # Check if the container already exists
  if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
      success "Docker container '${CONTAINER_NAME}' is already running."
      USE_DOCKER=true
      SKIP_DB_SETUP=true
    else
      info "Docker container '${CONTAINER_NAME}' exists but is stopped."
      if confirm "Start the existing container?"; then
        docker start "$CONTAINER_NAME" >/dev/null
        success "Container started."
        USE_DOCKER=true
        SKIP_DB_SETUP=true
      fi
    fi
  fi

  if [[ "$SKIP_DB_SETUP" == false ]]; then
    info "Docker is available — using it for PostgreSQL (recommended)."
    USE_DOCKER=true

    DB_PORT=$(ask "PostgreSQL port" "5432")

    # Check if the port is already in use
    if lsof -i :"$DB_PORT" &>/dev/null; then
      warn "Port $DB_PORT is already in use."
      if confirm "Use a different port?" "y"; then
        DB_PORT=$(ask "Enter a different port" "5433")
      else
        warn "Proceeding anyway — the Docker container may fail to bind."
      fi
    fi

    DB_PASSWORD=$(ask "PostgreSQL password" "postgres")

    info "Starting PostgreSQL 16 in Docker..."
    docker run --name "$CONTAINER_NAME" \
      -e POSTGRES_USER="$DB_USER" \
      -e POSTGRES_PASSWORD="$DB_PASSWORD" \
      -e POSTGRES_DB="$DB_NAME" \
      -p "${DB_PORT}:5432" \
      -d postgres:16 >/dev/null

    # Wait for PostgreSQL to be ready
    info "Waiting for PostgreSQL to accept connections..."
    for i in $(seq 1 30); do
      if docker exec "$CONTAINER_NAME" pg_isready -U "$DB_USER" &>/dev/null; then
        break
      fi
      sleep 1
    done

    if docker exec "$CONTAINER_NAME" pg_isready -U "$DB_USER" &>/dev/null; then
      success "PostgreSQL is ready on port $DB_PORT."
    else
      error "PostgreSQL did not become ready in time. Check: docker logs $CONTAINER_NAME"
    fi
  fi
else
  # No Docker — check for local psql
  if command -v psql &>/dev/null; then
    success "Found local psql: $(psql --version | head -1)"
    info "Using your local PostgreSQL installation."

    DB_HOST=$(ask "PostgreSQL host" "localhost")
    DB_PORT=$(ask "PostgreSQL port" "5432")
    DB_USER=$(ask "PostgreSQL user" "postgres")
    DB_PASSWORD=$(ask "PostgreSQL password" "postgres")
    DB_NAME=$(ask "Database name" "chalkdust")

    # Try to create the database if it doesn't exist
    if PGPASSWORD="$DB_PASSWORD" psql -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" -lqt 2>/dev/null | cut -d\| -f1 | grep -qw "$DB_NAME"; then
      success "Database '$DB_NAME' already exists."
    else
      info "Creating database '$DB_NAME'..."
      PGPASSWORD="$DB_PASSWORD" createdb -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" "$DB_NAME" 2>/dev/null \
        && success "Database created." \
        || error "Could not create database. Please create it manually:\n  CREATE DATABASE $DB_NAME;"
    fi
  else
    error "Neither Docker nor PostgreSQL found. Please install one of them:\n  Docker: https://docs.docker.com/get-docker/\n  PostgreSQL: https://www.postgresql.org/download/"
  fi
fi

DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
info "Connection string: $DATABASE_URL"

# ─── 3. AI provider ─────────────────────────────────────────────────────────

header "AI provider configuration"

echo "Which AI provider do you want to use?"
echo ""
echo "  1) OpenAI"
echo "  2) Anthropic"
echo "  3) Both (configure both keys now)"
echo ""
AI_CHOICE=$(ask "Choose [1/2/3]" "1")

AI_PROVIDER=""
OPENAI_KEY=""
ANTHROPIC_KEY=""

case "$AI_CHOICE" in
  1)
    AI_PROVIDER="openai"
    OPENAI_KEY=$(ask_secret "Enter your OpenAI API key (sk-...)")
    [[ -z "$OPENAI_KEY" ]] && error "OpenAI API key is required."
    ;;
  2)
    AI_PROVIDER="anthropic"
    ANTHROPIC_KEY=$(ask_secret "Enter your Anthropic API key (sk-ant-...)")
    [[ -z "$ANTHROPIC_KEY" ]] && error "Anthropic API key is required."
    ;;
  3)
    AI_PROVIDER=$(ask "Default provider" "openai")
    OPENAI_KEY=$(ask_secret "Enter your OpenAI API key (sk-...)")
    ANTHROPIC_KEY=$(ask_secret "Enter your Anthropic API key (sk-ant-...)")
    [[ -z "$OPENAI_KEY" && -z "$ANTHROPIC_KEY" ]] && error "At least one API key is required."
    ;;
  *)
    error "Invalid choice. Please run the script again."
    ;;
esac

success "AI provider set to: $AI_PROVIDER"

# ─── 4. Write .env.local ────────────────────────────────────────────────────

header "Writing .env.local"

ENV_FILE=".env.local"

if [[ -f "$ENV_FILE" ]]; then
  if confirm "A .env.local file already exists. Overwrite it?"; then
    cp "$ENV_FILE" "${ENV_FILE}.bak"
    info "Backed up existing file to ${ENV_FILE}.bak"
  else
    warn "Keeping existing .env.local — skipping write."
    # Source existing values so subsequent steps still work
    success "Using existing .env.local"
    SKIP_ENV_WRITE=true
  fi
fi

if [[ "${SKIP_ENV_WRITE:-}" != "true" ]]; then
  cat > "$ENV_FILE" << EOF
# Database
DATABASE_URL=${DATABASE_URL}

# AI Provider: "openai" or "anthropic"
AI_PROVIDER=${AI_PROVIDER}

# OpenAI
OPENAI_API_KEY=${OPENAI_KEY:-sk-...}

# Anthropic
ANTHROPIC_API_KEY=${ANTHROPIC_KEY:-sk-ant-...}
EOF
  success ".env.local written."
fi

# ─── 5. Install dependencies ────────────────────────────────────────────────

header "Installing npm dependencies"

npm install
success "Dependencies installed."

# ─── 6. Push database schema ────────────────────────────────────────────────

header "Pushing database schema"

info "Running drizzle-kit push to create tables..."
DATABASE_URL="$DATABASE_URL" npx drizzle-kit push
success "Database schema applied."

# ─── 7. Seed default teacher ────────────────────────────────────────────────

header "Seeding default teacher"

SEED_SQL="INSERT INTO teachers (id, name, email)
VALUES ('00000000-0000-0000-0000-000000000001', 'Demo Lehrkraft', 'demo@chalkdust.de')
ON CONFLICT (id) DO NOTHING;"

if [[ "$USE_DOCKER" == true ]]; then
  docker exec -i "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -c "$SEED_SQL" >/dev/null 2>&1
else
  PGPASSWORD="$DB_PASSWORD" psql -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -c "$SEED_SQL" >/dev/null 2>&1
fi

success "Default teacher seeded (Demo Lehrkraft)."

# ─── 8. Create upload directories ───────────────────────────────────────────

header "Creating upload directories"

mkdir -p public/uploads/curricula public/uploads/materials
success "public/uploads/curricula and public/uploads/materials created."

# ─── 9. Done ────────────────────────────────────────────────────────────────

header "Setup complete!"

printf "${GREEN}${BOLD}"
cat << 'DONE'
  ┌──────────────────────────────────────────────┐
  │  Everything is ready! Start developing with:  │
  │                                                │
  │    npm run dev                                 │
  │                                                │
  │  Then open http://localhost:3000/dashboard     │
  └──────────────────────────────────────────────┘
DONE
printf "${NC}\n"

if confirm "Start the dev server now?"; then
  exec npm run dev
fi
