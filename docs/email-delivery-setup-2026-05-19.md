## Email Delivery Setup - 2026-05-19

### Current state
- Auth emails now support two delivery modes:
  - `preview`
  - `smtp`
- Verification and password-reset emails both use the same delivery layer.
- Local and staging are wired to `smtp` using Mailpit so flows can be tested end to end without an external provider.

### Files
- API mail delivery:
  - `D:\CODING\Eğitim Gurmesi Web+WebApp\apps\api\src\auth\auth-notifications.service.ts`
- Env helpers:
  - `D:\CODING\Eğitim Gurmesi Web+WebApp\apps\api\src\config\env.ts`
- Local infra:
  - `D:\CODING\Eğitim Gurmesi Web+WebApp\docker-compose.local.yml`
- Staging infra:
  - `D:\CODING\Eğitim Gurmesi Web+WebApp\docker-compose.staging.yml`
- Env examples:
  - `D:\CODING\Eğitim Gurmesi Web+WebApp\.env`
  - `D:\CODING\Eğitim Gurmesi Web+WebApp\.env.staging`
  - `D:\CODING\Eğitim Gurmesi Web+WebApp\.env.staging.example`

### Supported env keys
- `EMAIL_PROVIDER`
  - `preview` or `smtp`
- `EMAIL_FROM`
- `EMAIL_FROM_NAME`
- `EMAIL_REPLY_TO`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASSWORD`

### Local rehearsal
- SMTP host: `localhost`
- SMTP port: `1025`
- Mailbox UI: [http://localhost:8025](http://localhost:8025)

### Staging rehearsal
- SMTP host inside compose network: `mailpit`
- SMTP port inside compose network: `1025`
- Mailbox UI on host: [http://localhost:8026](http://localhost:8026)

### Real provider cutover
Replace staging/production values with your real SMTP provider:

```env
EMAIL_PROVIDER=smtp
EMAIL_FROM=no-reply@your-domain.com
EMAIL_FROM_NAME=Eğitim Gurmesi Akademi
EMAIL_REPLY_TO=destek@your-domain.com
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=replace-me
SMTP_PASSWORD=replace-me
```

If your provider requires implicit TLS, use:

```env
SMTP_PORT=465
SMTP_SECURE=true
```

### Verified flows
- user registration -> verification email delivered
- password reset request -> reset email delivered
- no preview URL is returned when SMTP delivery is active

### Remaining production tasks
- replace staging Mailpit with real provider credentials
- configure real sender domain and SPF/DKIM/DMARC
- add bounce/complaint monitoring if the chosen provider supports it
