# Staging / Deployment Checklist

Date: 2026-05-17  
Repository: `D:\CODING\Eğitim Gurmesi Web+WebApp`

## Purpose

This checklist defines what must exist before:

1. a real staging environment can be considered valid
2. the product can be promoted from staging to production

It is based on the current repository state, not an idealized future architecture.

## Current Reality

The application is locally runnable and feature-rich, but the deployment layer is still incomplete.

What exists today:
- local Docker orchestration for PostgreSQL and Redis via `docker-compose.local.yml`
- working public web app
- working admin app
- working NestJS API
- Prisma migrations and seeds
- Playwright E2E smoke suite for:
  - public web
  - student panel
  - admin core
  - local checkout initiation
  - admin content save/revert

What does **not** exist yet in the repo:
- production Dockerfiles
- staging Dockerfiles
- deployment manifests
- reverse proxy configuration
- CI/CD pipeline
- secrets management policy
- backup/restore runbook
- monitoring / alerting configuration
- production media storage workflow

## Deployment Target Assumption

The checklist assumes a 3-app deployment:

1. `apps/web`
2. `apps/admin`
3. `apps/api`

with managed infrastructure for:

1. PostgreSQL
2. Redis
3. media storage / streaming
4. email provider
5. payment/provider secrets

## P0 Blockers Before Any Real Staging Demo

These must be completed before a serious shared staging environment is considered valid.

- Define the hosting model:
  - VM-based
  - Docker-based
  - container platform
  - managed Node deployment
- Decide the public domains:
  - main site domain
  - admin domain or subdomain
  - API domain or internal/private routing model
- Create environment-specific secrets for:
  - auth
  - database
  - redis
  - email
  - payment
  - Unikazan
  - media
- Add production/staging build and run instructions to the repo
- Add a reproducible database migration process for staging and production
- Add a backup plan for PostgreSQL before any live data use

## Environment Checklist

### Required Environment Variables

From the current codebase, these are mandatory or effectively mandatory:

#### Shared / Domains
- `NODE_ENV`
- `PUBLIC_APP_URL`
- `ADMIN_APP_URL`
- `API_APP_URL`
- `NEXT_PUBLIC_API_BASE_URL`

#### Database
- `DATABASE_URL`
- `DIRECT_URL`

#### Cache
- `REDIS_URL`

#### Authentication
- `AUTH_SECRET`
- `BOOTSTRAP_ADMIN_SECRET`
- `AUTH_COOKIE_DOMAIN`

#### Email
- `EMAIL_PROVIDER`
- `EMAIL_FROM`
- `EMAIL_API_KEY`

#### Payment
- `PAYMENT_PROVIDER`
- `PAYMENT_MERCHANT_ID`
- `PAYMENT_API_KEY`
- `PAYMENT_SECRET_KEY`
- `PAYMENT_BASE_URL`

#### Unikazan
- `UNIKAZAN_API_BASE_URL`
- `UNIKAZAN_API_KEY`
- `UNIKAZAN_PROJECT_KEY`
- `UNIKAZAN_ADMIN_KEY`
- `UNIKAZAN_WEBHOOK_SECRET`

#### Media
- `MUX_TOKEN_ID`
- `MUX_TOKEN_SECRET`
- `MUX_WEBHOOK_SECRET`

#### WhatsApp
- `WHATSAPP_PHONE_E164`
- `WHATSAPP_DEFAULT_MESSAGE`

### Environment Separation Rules

Before staging goes live:

- staging must not reuse local `.env`
- staging secrets must differ from production secrets
- production secrets must never be committed
- staging and production databases must be separate
- staging and production Redis instances must be separate
- staging email sender must be isolated from production sender

## Infrastructure Checklist

### Database

Required:
- managed or self-hosted PostgreSQL instance
- automatic backups enabled
- restore procedure tested at least once
- migration plan documented
- rollback expectation defined

Open work:
- no backup/restore runbook exists in the repo yet
- no staging data policy exists yet

### Redis

Required:
- separate Redis instance for staging
- separate Redis instance for production
- connection/auth policy defined

Open work:
- current repo assumes Redis exists, but has no production infra definition

### Node Runtime

Required:
- exact Node version pinned in deployment runtime
- one process strategy per app defined:
  - `next start` for web
  - `next start` for admin
  - `node dist/main.js` for API

Open work:
- no process manager config in repo
- no Dockerfiles in repo

### Reverse Proxy / TLS

Required:
- HTTPS for web/admin/api
- reverse proxy or platform routing plan
- canonical domain rules
- admin access control strategy

Open work:
- no Nginx/Caddy config in repo

## Application Deployment Checklist

### Public Web

Ready:
- builds locally
- feature-complete enough for staged demo
- E2E smoke coverage exists

Must verify in staging:
- homepage
- navbar and mobile nav
- `paketlerimiz`
- package details
- `ucretsiz-materyaller`
- `akademik-kadro`
- `giris`
- `hesabim`
- `derslerim`

Still needed:
- final responsive pass
- final content/encoding pass
- real media asset strategy

### Admin

Ready:
- content studio
- commerce center
- lead management
- audit page

Must verify in staging:
- login
- content save
- product/category CRUD
- order management
- leads page
- audit visibility

Still needed:
- polish rough editor UX
- verify permission boundaries with non-super-admin staff accounts

### API

Ready:
- core modules compile and run
- local health endpoint works
- auth, content, commerce, LMS, engagement, audit endpoints exist

Must verify in staging:
- CORS configuration
- email verification URLs
- password reset URLs
- payment return URLs
- API base URL correctness from both web and admin

Still needed:
- production logging policy
- metrics / alerts
- request tracing or equivalent observability

## Database Migration Checklist

Before first staging deployment:

1. run `npm run db:validate`
2. run `npm run db:generate`
3. apply all pending migrations
4. verify Prisma client generation in deployment environment
5. run staging-safe seed only if intentionally needed

Rules:
- do not run destructive local seed logic against staging or production blindly
- define a separate seed policy for:
  - local
  - demo/staging
  - production bootstrap

## Commerce / Payment Checklist

### Already Implemented
- order core
- checkout foundation
- admin order management
- payment return recording endpoint
- PayTR hosted local-product checkout adapter
- PayTR signed server callback endpoint
- Unikazan adapter foundation

### Still Blocking Production
- real PayTR merchant credentials
- PayTR merchant panel callback/notification URL configuration
- real PayTR checkout smoke against sandbox or production credentials
- final Unikazan reconciliation contract
- production-grade payment success proof

Staging checklist:
- local product checkout initiation works
- PayTR token creation returns a hosted payment session
- PayTR posts server callback to `/v1/orders/public/paytr/callback`
- PayTR callback signature is verified
- redirect package order creation works
- provider return hits `/odeme/durum`
- order/payment/external status transitions are recorded

Production blocker:
- PayTR credentials are not received yet. Before go-live, provision `PAYMENT_MERCHANT_ID`, `PAYMENT_API_KEY`, and `PAYMENT_SECRET_KEY`, then run a real hosted checkout smoke.
- PayTR callback URL must be configured as `https://<production-domain>/v1/orders/public/paytr/callback`.
- Unikazan has still not provided the final webhook/status-check contract needed for true independent payment confirmation

## Media Checklist

Current status:
- media models exist
- URL-based placeholders exist
- product intro video hooks exist
- homepage showcase media editing exists
- admin media library exists at `/medya`
- local upload API exists at `/v1/admin-media/upload`
- public file serving exists at `/v1/media/assets/:id/file`
- external video URL normalization exists for Google Drive, YouTube, Vimeo, direct video files, and generic embed URLs

Still missing for production:
- final canonical storage location
- CDN or streaming decision
- retention and cleanup policy
- persistent volume backup verification

Must decide:
- whether production uploads stay on server volume or move to object storage/CDN
- cloud streamer/provider for large paid lesson videos
- final admin upload size limit

## Email Checklist

Current status:
- verification/reset logic exists
- local preview URL flow works

Still needed:
- real email provider credentials
- sender/domain verification
- staging-safe sender config
- production-safe rate and failure monitoring

Staging must verify:
- registration verification email
- password reset email
- admin/staff email flows if later added

## Security Checklist

Before staging handoff to non-developers:

- rotate any secrets that were ever shared in plaintext docs or screenshots
- ensure `.env` is excluded from version control
- confirm admin credentials are not default demo values
- disable bootstrap route in production or guard it with a production-safe secret policy
- verify auth cookie/domain behavior
- verify CORS allowlist

Current concern:
- Unikazan credentials were previously handled in a plaintext vendor file; if those were broadly shared, rotate them

## Testing Checklist

### Already Exists
- Playwright smoke suite
- 11 passing E2E smoke tests

### Must Be Run Before Staging Signoff
- `npm run typecheck`
- `npm run build`
- `npm run test:e2e`

### Still Worth Adding
- payment return flow assertion
- lead submission E2E
- admin lead status update E2E
- package detail and filter persistence assertions
- API integration tests for auth/orders/content save

## Staging Acceptance Checklist

A staging deployment is acceptable only when all of these are true:

- web, admin, and API are deployed on stable staging URLs
- database migrations applied successfully
- email verification works against staging URL
- password reset works against staging URL
- content save from admin is reflected on public web
- local product checkout initiation works end-to-end
- Unikazan redirect package flow reaches provider correctly
- lead submission from homepage modal reaches admin leads page
- LMS dashboard opens for an authenticated student
- `npm run test:e2e` passes against staging or a staging-aligned environment

## Production Go-Live Checklist

Production should not happen until:

- staging checklist is fully green
- production secrets are provisioned
- backup and restore process is documented and tested
- on-call / incident owner is defined
- monitoring and alerting are enabled
- admin access policy is defined
- Unikazan reconciliation is production-complete
- PayTR credentials and callback configuration are production-complete
- payment provider configuration is production-complete
- media pipeline is production-complete

## Recommended Next Steps

### P0
- define deployment target and hosting model
- add Dockerfiles or runtime deployment definitions
- add reverse-proxy / TLS routing plan
- define staging environment variables
- define production environment variables

### P1
- add deployment runbook
- add backup/restore runbook
- add CI/CD pipeline for build + migrate + deploy
- add monitoring / alerting

### P2
- verify production media storage persistence, CDN/streaming decision, and backup policy
- add deeper E2E around payment return and leads
- run full staging rehearsal

## Blunt Status

The product is **demo-ready** and now **test-backed at smoke level**, but it is **not yet deploy-ready** because the operational layer still does not exist in the repository.

The next serious milestone is not another UI feature.  
It is: **define and implement the staging deployment model**.
