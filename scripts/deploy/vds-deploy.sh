#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${APP_DIR:-/opt/egitim-gurmesi}"
REPO_URL="${REPO_URL:-}"
DEPLOY_REF="${DEPLOY_REF:-production}"
RUN_MIGRATIONS="${RUN_MIGRATIONS:-true}"
RESTART_SERVICES="${RESTART_SERVICES:-true}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.production.yml}"
ENV_FILE="${ENV_FILE:-.env.production}"
API_HEALTH_URL="${API_HEALTH_URL:-http://127.0.0.1/v1/health}"

if [[ -z "$REPO_URL" ]]; then
  echo "REPO_URL is required." >&2
  exit 1
fi

command -v git >/dev/null 2>&1 || { echo "git is required on the VDS." >&2; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "docker is required on the VDS." >&2; exit 1; }
docker compose version >/dev/null 2>&1 || { echo "docker compose plugin is required on the VDS." >&2; exit 1; }

mkdir -p "$APP_DIR"

if [[ ! -d "$APP_DIR/.git" ]]; then
  if [[ -n "$(find "$APP_DIR" -mindepth 1 -maxdepth 1 2>/dev/null)" ]]; then
    echo "$APP_DIR is not empty and is not a git repository." >&2
    exit 1
  fi

  git clone "$REPO_URL" "$APP_DIR"
fi

cd "$APP_DIR"

previous_sha="$(git rev-parse HEAD 2>/dev/null || true)"
echo "Previous SHA: ${previous_sha:-none}"

git fetch origin --tags --prune

if git rev-parse --verify --quiet "$DEPLOY_REF" >/dev/null; then
  target_ref="$DEPLOY_REF"
elif git rev-parse --verify --quiet "origin/$DEPLOY_REF" >/dev/null; then
  target_ref="origin/$DEPLOY_REF"
else
  target_ref="$DEPLOY_REF"
fi

git checkout --force "$target_ref"
git reset --hard "$target_ref"
current_sha="$(git rev-parse HEAD)"
current_branch="$(git rev-parse --abbrev-ref HEAD || echo "$DEPLOY_REF")"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "$ENV_FILE is missing in $APP_DIR. Create it from .env.production.example before deploying." >&2
  exit 1
fi

export APP_GIT_SHA="$current_sha"
export APP_GIT_BRANCH="$current_branch"

if [[ "$RUN_MIGRATIONS" == "true" ]]; then
  echo "Running Prisma migrations inside a temporary API image..."
  docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" build api
  docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" run --rm api \
    npm --workspace @ega/db exec prisma migrate deploy --schema packages/db/prisma/schema.prisma
fi

if [[ "$RESTART_SERVICES" == "true" ]]; then
  echo "Building and restarting production services..."
  docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up -d --build
fi

echo "Waiting for API health check: $API_HEALTH_URL"
for attempt in $(seq 1 30); do
  if curl -fsS "$API_HEALTH_URL" >/dev/null; then
    mkdir -p "$APP_DIR/.deploy"
    cat > "$APP_DIR/.deploy/current.json" <<JSON
{
  "previousSha": "${previous_sha}",
  "deployedSha": "${current_sha}",
  "ref": "${DEPLOY_REF}",
  "branch": "${current_branch}",
  "deployedAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
}
JSON
    echo "Deploy finished: $current_sha"
    exit 0
  fi

  echo "Health check not ready yet ($attempt/30)."
  sleep 5
done

echo "Deployment finished but API health check failed." >&2
exit 1
