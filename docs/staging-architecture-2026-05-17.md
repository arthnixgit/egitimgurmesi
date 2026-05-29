# Staging Architecture

Date: 2026-05-17  
Repository: `D:\CODING\Eğitim Gurmesi Web+WebApp`

## Chosen Staging Model

The staging architecture is now defined as:

1. `Caddy` as the public TLS and routing entrypoint
2. `apps/web` as the public site service
3. `apps/admin` as the admin site service
4. `apps/api` as the backend API service
5. `PostgreSQL` as the application database
6. `Redis` as the cache / queue-compatible runtime cache

All of these run inside one Docker Compose stack for staging.

## Domain Routing

Caddy routes by hostname:

- `PUBLIC_SITE_HOST` -> `web:3000`
- `ADMIN_SITE_HOST` -> `admin:3001`
- `API_SITE_HOST` -> `api:4000`

These are defined through:

- [D:\CODING\Eğitim Gurmesi Web+WebApp\deploy\staging\Caddyfile](</D:/CODING/Eğitim Gurmesi Web+WebApp/deploy/staging/Caddyfile>)

## Build Strategy

### Web

- Next.js standalone build
- Dockerfile:
  - [D:\CODING\Eğitim Gurmesi Web+WebApp\deploy\docker\Dockerfile.web](</D:/CODING/Eğitim Gurmesi Web+WebApp/deploy/docker/Dockerfile.web>)

### Admin

- Next.js standalone build
- Dockerfile:
  - [D:\CODING\Eğitim Gurmesi Web+WebApp\deploy\docker\Dockerfile.admin](</D:/CODING/Eğitim Gurmesi Web+WebApp/deploy/docker/Dockerfile.admin>)

### API

- NestJS compiled output
- Prisma client generated during image build
- Dockerfile:
  - [D:\CODING\Eğitim Gurmesi Web+WebApp\deploy\docker\Dockerfile.api](</D:/CODING/Eğitim Gurmesi Web+WebApp/deploy/docker/Dockerfile.api>)

## Required Files Added

- [D:\CODING\Eğitim Gurmesi Web+WebApp\docker-compose.staging.yml](</D:/CODING/Eğitim Gurmesi Web+WebApp/docker-compose.staging.yml>)
- [D:\CODING\Eğitim Gurmesi Web+WebApp\.env.staging.example](</D:/CODING/Eğitim Gurmesi Web+WebApp/.env.staging.example>)
- [D:\CODING\Eğitim Gurmesi Web+WebApp\.dockerignore](</D:/CODING/Eğitim Gurmesi Web+WebApp/.dockerignore>)

## Runtime Assumptions

- staging is containerized
- TLS termination happens at Caddy
- database and redis are internal to the compose network
- only Caddy exposes ports publicly

## Operational Commands

Added in root [D:\CODING\Eğitim Gurmesi Web+WebApp\package.json](</D:/CODING/Eğitim Gurmesi Web+WebApp/package.json>):

```powershell
npm run staging:build
npm run staging:up
npm run staging:down
npm run staging:logs
npm run staging:migrate
```

## First-Time Staging Setup

1. Copy:
   - [D:\CODING\Eğitim Gurmesi Web+WebApp\.env.staging.example](</D:/CODING/Eğitim Gurmesi Web+WebApp/.env.staging.example>)
   to:
   - `D:\CODING\Eğitim Gurmesi Web+WebApp\.env.staging`
2. Replace all placeholder values.
3. Point the 3 hostnames to the staging server.
4. Run:

```powershell
npm run staging:build
npm run staging:up
npm run staging:migrate
```

## What This Solves

This gives the project a real staging deployment shape for the first time:

- reproducible app containers
- stable staging domain routing
- isolated env vars
- a migration command for staged databases

## What Still Needs To Be Added Later

- CI/CD pipeline
- backup and restore automation
- monitoring and alerting
- secrets management outside plain env files
- production-specific deployment variant

## Blunt Status

The repo now has a **defined staging architecture** and **deployable staging files**.

It still does **not** have a complete production operations layer, but the project is no longer missing the deployment starting point.
