# VDS GitHub Deployment Setup

This project now supports controlled production updates from the admin panel. The admin panel does not run shell commands directly on the VDS. It calls the API, the API dispatches a GitHub Actions workflow, and GitHub connects to the VDS over SSH to run the fixed deploy script.

## Required VDS Setup

1. Install Docker Engine, Docker Compose plugin, Git, and OpenSSH server.
2. Create a non-root deploy user, for example `deploy`.
3. Add the GitHub Actions public SSH key to `/home/deploy/.ssh/authorized_keys`.
4. Create the application folder, for example `/opt/egitim-gurmesi`.
5. Put the production environment file at `/opt/egitim-gurmesi/.env.production`.
6. Point DNS records to the VDS for:
   - public website domain
   - admin panel domain
   - API domain
7. Open ports `80` and `443`.

## GitHub Repository Secrets

Add these secrets in GitHub repository settings:

| Secret | Why it is needed |
| --- | --- |
| `VDS_SSH_HOST` | VDS IP or hostname used by GitHub Actions. |
| `VDS_SSH_USER` | SSH user that runs the deployment script, normally `deploy`. |
| `VDS_SSH_KEY` | Private SSH key for GitHub Actions to connect to the VDS. |
| `VDS_SSH_PORT` | Optional SSH port. Defaults to `22`. |
| `VDS_APP_DIR` | Server folder, for example `/opt/egitim-gurmesi`. |
| `VDS_REPO_URL` | Git clone URL, for example `git@github.com:OWNER/REPO.git`. |
| `VDS_API_HEALTH_URL` | Optional health-check URL, for example `https://api.example.com/v1/health`. |

## Production API Environment

Set these in `.env.production` on the VDS:

```env
DEPLOY_ENABLED=true
DEPLOY_GITHUB_REPOSITORY=OWNER/REPO
DEPLOY_GITHUB_BRANCH=production
DEPLOY_GITHUB_WORKFLOW_ID=deploy-vds.yml
DEPLOY_GITHUB_TOKEN=github_fine_grained_token_here
```

The GitHub token should be fine-grained and limited to this repository. It needs:

- Actions: read/write
- Contents: read

Do not use a personal all-repository token unless there is no alternative.

## Deployment Flow

1. Push code to GitHub.
2. The admin panel checks the VDS running commit against the latest GitHub commit.
3. If a newer commit exists, the admin panel shows an update notice.
4. An authorized admin opens `Guncellemeler` and clicks `Guncellemeyi Baslat`.
5. API dispatches `.github/workflows/deploy-vds.yml`.
6. GitHub SSHs into the VDS and runs `scripts/deploy/vds-deploy.sh`.
7. The script updates the repo, builds containers, applies Prisma migrations, restarts services, and health-checks the API.

## Go-Live Reminder

Before live service, verify:

- `.env.production` contains real database, JWT, SMTP, media, PayTR, and Unikazan values.
- PayTR production credentials are added when received.
- Database backup automation exists before the first real order.
- GitHub deployment token is stored only on the VDS/API environment and can be rotated.
- The deploy SSH user can only access the application folder and Docker operations needed for this project.
