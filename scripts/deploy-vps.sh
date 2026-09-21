#!/usr/bin/env bash
#
# Production deploy for the VPS. Run from anywhere, as the deploy user:
#
#     bash /var/www/ega-platform/scripts/deploy-vps.sh
#
# Why this exists: Next.js bakes NEXT_PUBLIC_* values into the JavaScript at
# build time. Every manual deploy depended on remembering to source
# .env.production into the same shell before `turbo build`. Twice that step
# was missed, the admin was built with no API URL, fell back to calling itself,
# and staff login broke on production with "Request could not be processed."
#
# This script sources the environment itself and refuses to build when the
# values the bundles need are missing or unusable — so a skipped step fails
# here, loudly, instead of on the live site.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

step() { printf '\n\033[1;36m==> %s\033[0m\n' "$*"; }
fail() { printf '\n\033[1;31mDEPLOY STOPPED: %s\033[0m\n' "$*" >&2; exit 1; }

step "Loading .env.production"
[ -f .env.production ] || fail ".env.production not found in $ROOT"
set -a
# shellcheck disable=SC1091
source .env.production
set +a

# Prisma's migrate CLI needs DIRECT_URL; the running API does not. It has been
# missing from this server's env file before, so default it rather than fail.
export DIRECT_URL="${DIRECT_URL:-${DATABASE_URL:-}}"

step "Checking the values baked into the bundles"
[ -n "${DATABASE_URL:-}" ] || fail "DATABASE_URL is not set"
[ -n "${NEXT_PUBLIC_API_BASE_URL:-}" ] || fail "NEXT_PUBLIC_API_BASE_URL is not set — the admin would call itself and login would break"
case "$NEXT_PUBLIC_API_BASE_URL" in
  https://*) ;;
  *) fail "NEXT_PUBLIC_API_BASE_URL must be an absolute https:// URL, got: $NEXT_PUBLIC_API_BASE_URL" ;;
esac
echo "API base URL: $NEXT_PUBLIC_API_BASE_URL"

step "Pulling main"
git fetch origin
git checkout main
git pull --ff-only origin main
git log --oneline -1

step "Applying database migrations (only pending ones; never resets data)"
( cd packages/db && npx prisma migrate deploy --schema prisma/schema.prisma )

# The Prisma client's TypeScript types and query shapes are generated from
# schema.prisma. `migrate deploy` does not regenerate them, so without this a
# release that adds columns fails the API typecheck/build — or worse, runs
# with a client that does not know the new columns.
step "Regenerating the Prisma client from the pulled schema"
( cd packages/db && npx prisma generate --schema prisma/schema.prisma )

step "Building every app with a clean cache"
npx turbo run build --force

step "Confirming the admin bundle carries the API URL"
if ! grep -rqF "$NEXT_PUBLIC_API_BASE_URL" apps/admin/.next/static; then
  # By this point the build has already replaced .next/, so this is a final
  # assertion rather than a guard — the real protection is the check before
  # the build. Stopping here keeps a known-broken admin from being restarted.
  fail "the admin build does not contain $NEXT_PUBLIC_API_BASE_URL — not restarting; investigate before running pm2 restart"
fi
echo "ok"

step "Restarting services"
pm2 restart ecosystem.config.js --update-env
pm2 save
pm2 status

step "Deploy complete"
