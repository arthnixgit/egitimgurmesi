# VPS beta deployment runbook

This runbook prepares a controlled online beta for the current monorepo on a Linux VPS/VDS.

Official first beta deployment strategy: **PM2 + Nginx**.

Docker/Caddy files in this repository are kept only as **Future Alternative Deployment / Experimental** assets. Do not use the Docker/Caddy workflow for the first VPS beta unless the release owner explicitly changes the deployment strategy.

Target process layout:

- Website: `127.0.0.1:3000`
- Admin panel: `127.0.0.1:3001`
- API: `127.0.0.1:4000`
- PostgreSQL: local server on `127.0.0.1:5432`
- Nginx: public reverse proxy on ports `80` and `443`
- PM2: process manager for the three Node.js apps

Public routing:

- `https://YOUR_DOMAIN.com` -> website
- `https://admin.YOUR_DOMAIN.com` -> admin panel
- `https://api.YOUR_DOMAIN.com` -> API

## Deployment audit summary

Current monorepo:

- Package manager: `npm@11.11.0`
- Workspaces: `apps/*`, `packages/*`
- Website app: `apps/web`, Next.js, `next build`, `next start`
- Admin app: `apps/admin`, Next.js, `next build`, `next start --port 3001`
- API app: `apps/api`, NestJS compiled with TypeScript, `node dist/main.js`
- Database package: `packages/db`, Prisma schema at `packages/db/prisma/schema.prisma`
- Migrations exist under `packages/db/prisma/migrations`
- Seed scripts exist, but `npm run db:seed` is destructive and must not be used on VPS/beta/production.
- Existing Docker/Caddy deployment files exist as Future Alternative Deployment / Experimental assets. This runbook uses PM2 + Nginx as the official first beta deployment path.

Health behavior:

- API route: `GET /v1/health`
- The health route itself returns static JSON.
- The API process still requires PostgreSQL during startup because `PrismaService.onModuleInit()` calls `$connect()`. If PostgreSQL is unavailable, the API may fail before `/v1/health` can respond.

## 1. Server bootstrap

Run as root or a sudo user on Ubuntu 22.04/24.04.

```bash
sudo apt update
sudo apt install -y curl git nginx postgresql postgresql-contrib ufw certbot python3-certbot-nginx

curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

node -v
npm -v
sudo npm install -g npm@11.11.0 pm2
```

Create a non-root deployment user:

```bash
sudo adduser deploy
sudo usermod -aG sudo deploy
sudo mkdir -p /opt/egitim-gurmesi
sudo chown deploy:deploy /opt/egitim-gurmesi
```

## 2. Firewall

Only expose SSH, HTTP and HTTPS.

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status
```

Do not expose ports `3000`, `3001`, `4000`, `5432`, or `6379` publicly.

## 3. PostgreSQL setup

Create the production database and user:

```bash
sudo -u postgres psql
```

```sql
CREATE USER ega WITH PASSWORD 'REPLACE_STRONG_DB_PASSWORD';
CREATE DATABASE ega_production OWNER ega;
GRANT ALL PRIVILEGES ON DATABASE ega_production TO ega;
\q
```

Database URL format:

```text
postgresql://ega:REPLACE_STRONG_DB_PASSWORD@127.0.0.1:5432/ega_production
```

## 4. Application checkout

Switch to the deploy user:

```bash
sudo su - deploy
cd /opt/egitim-gurmesi
git clone REPLACE_GITHUB_REPO_URL .
git checkout production
```

Prepare environment:

```bash
cp .env.vps.example .env.production
nano .env.production
```

Replace:

- `YOUR_DOMAIN.com`
- database password
- `AUTH_SECRET`
- `BOOTSTRAP_ADMIN_SECRET`
- SMTP settings
- WhatsApp number
- PayTR placeholders when credentials arrive
- Unikazan placeholders when credentials arrive

Generate strong secrets:

```bash
openssl rand -base64 48
```

## 5. Install, migrate and build

Load production env for the current shell:

```bash
set -a
source .env.production
set +a
```

Install dependencies and prepare Prisma:

```bash
npm ci
npm run db:generate
npm --workspace @ega/db exec prisma migrate deploy --schema packages/db/prisma/schema.prisma
```

Optional beta/demo data only:

```bash
npm run seed:beta
```

Warnings:

- Do **not** run `npm run db:seed` on VPS, beta, or production.
- `npm run db:seed` is destructive and only for full local reset/dev rebuild.
- Use `npm run seed:beta` only if safe demo beta data is needed.
- For real beta onboarding, admins should enter real organizations, branches, users, packages, sessions, and announcements manually through the admin panel.

Build all apps:

```bash
npm run build
```

Create runtime folders:

```bash
mkdir -p logs/pm2 storage/media
```

## 6. PM2 start

Start the services:

```bash
set -a
source .env.production
set +a
pm2 start ecosystem.config.js --update-env
pm2 status
pm2 save
```

Enable PM2 startup after reboot:

```bash
pm2 startup systemd -u deploy --hp /home/deploy
```

Run the command PM2 prints with `sudo`, then:

```bash
pm2 save
```

Restart after future updates:

```bash
cd /opt/egitim-gurmesi
git pull
set -a
source .env.production
set +a
npm ci
npm run db:generate
npm --workspace @ega/db exec prisma migrate deploy --schema packages/db/prisma/schema.prisma
npm run build
pm2 reload ecosystem.config.js --update-env
pm2 status
```

## 7. Nginx setup

Copy templates:

```bash
sudo cp /opt/egitim-gurmesi/deploy/nginx/website.conf /etc/nginx/sites-available/egitim-gurmesi-website.conf
sudo cp /opt/egitim-gurmesi/deploy/nginx/admin.conf /etc/nginx/sites-available/egitim-gurmesi-admin.conf
sudo cp /opt/egitim-gurmesi/deploy/nginx/api.conf /etc/nginx/sites-available/egitim-gurmesi-api.conf
```

Replace placeholder domain:

```bash
sudo sed -i 's/YOUR_DOMAIN.com/example.com/g' /etc/nginx/sites-available/egitim-gurmesi-*.conf
```

Enable sites:

```bash
sudo ln -s /etc/nginx/sites-available/egitim-gurmesi-website.conf /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/egitim-gurmesi-admin.conf /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/egitim-gurmesi-api.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 8. SSL with Certbot

DNS must point to the VPS before this step.

```bash
sudo certbot --nginx -d example.com -d www.example.com -d admin.example.com -d api.example.com
sudo certbot renew --dry-run
```

## 9. Health checks

From the VPS:

```bash
curl -fsS http://127.0.0.1:4000/v1/health
curl -I http://127.0.0.1:3000
curl -I http://127.0.0.1:3001
```

From outside after DNS and SSL:

```bash
curl -I https://example.com
curl -I https://admin.example.com
curl -fsS https://api.example.com/v1/health
```

Admin beta test:

- Open `https://admin.example.com`
- Bootstrap or log in as super admin.
- Create an organization.
- Create an education center.
- Create a branch.
- Add class/group data.
- Check public website content still loads.

## 10. Database backup and restore

Backup:

```bash
mkdir -p /opt/egitim-gurmesi/backups
pg_dump "$DATABASE_URL" | gzip > "/opt/egitim-gurmesi/backups/ega_$(date +%F_%H%M).sql.gz"
```

Restore:

```bash
gunzip -c /opt/egitim-gurmesi/backups/ega_BACKUP_FILE.sql.gz | psql "$DATABASE_URL"
```

For daily backups, add a cron job under the `deploy` user after confirming the command works manually.

## 11. Logs and operations

```bash
pm2 logs egitim-gurmesi-api
pm2 logs egitim-gurmesi-web
pm2 logs egitim-gurmesi-admin
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

Install PM2 log rotation:

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 20M
pm2 set pm2-logrotate:retain 14
```

## 12. Minimal production hardening checklist

- Use a non-root `deploy` user.
- Keep app ports local only.
- Expose only ports `22`, `80`, `443`.
- Use strong `.env.production` secrets.
- Never commit `.env.production`.
- Keep PostgreSQL bound locally.
- Enable SSL before sharing login URLs.
- Run Prisma migrations before PM2 reload.
- Enable PM2 startup and log rotation.
- Schedule database backups.
- Store media under `/opt/egitim-gurmesi/storage/media` and back it up.

## Known blockers before full go-live

- Real PayTR credentials are still required before live payment collection.
- Real Unikazan production credentials and final provisioning contract are still required.
- SMTP credentials must be verified for password reset and email verification.
- DNS and SSL must be completed before external beta users test the admin panel.
- A production backup schedule must be activated before real operational data is entered.
