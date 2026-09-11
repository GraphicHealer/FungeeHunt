---
sidebar_position: 3
---

# Environment Variables

All runtime configuration is done through environment variables. There are no UI controls for secrets or email.

## Required

| Variable | Description |
| --- | --- |
| `GM_PASSPHRASE` | The passphrase used to log in as Game Master on `/admin` and `/gm` routes. Change the default `changeme` in production. |
| `PG_USER` | PostgreSQL user |
| `PG_PASS` | PostgreSQL password |
| `PG_HOST` | PostgreSQL host or container name |
| `PG_DATABASE` | PostgreSQL database name |
| `UPLOAD_DIR` | Where player uploads are stored inside the container (e.g. `/data/uploads`) |

## Optional

| Variable | Description |
| --- | --- |
| `DATABASE_URL` | Full `postgresql://...` URL. If not set, the app builds one from the `PG_*` variables. |
| `PG_PORT` | PostgreSQL port (defaults to 5432) |
| `SESSION_SECRET` | Secret for signing GM/player tokens. If left blank, a random secret is generated and stored in the database on first boot. |
| `TRUST_PROXY` | Number of reverse proxies in front of the app so rate limiting sees real client IPs (defaults to 0) |
| `PUBLIC_URL` | Public URL of this deployment, e.g. `https://fungee.rdagitz.net`. Used by emails for links. If omitted, the URL from the create-game request is stored per-game. |
| `WEB_UI` | Port the server listens on (defaults to 3000) |
| `LOG_LEVEL` | Log level: `debug`, `info`, `warn`, or `error` (defaults to `info`) |
| `TZ` | Container timezone, e.g. `America/New_York` |

## Email (choose one method)

### SMTP

| Variable | Description |
| --- | --- |
| `SMTP_HOST` | SMTP server host |
| `SMTP_PORT` | SMTP server port (e.g. 465 or 587) |
| `SMTP_USER` | SMTP username |
| `SMTP_PASS` | SMTP password |
| `SMTP_FROM` | From address, e.g. `Fungee-Hunt <fungeehunt@example.com>` |
| `SMTP_SECURE` | `true` for implicit TLS (port 465), `false` for STARTTLS. Defaults to `true`. |

### Gmail OAuth

| Variable | Description |
| --- | --- |
| `GMAIL_CLIENT_ID` | Google OAuth client ID |
| `GMAIL_CLIENT_SECRET` | Google OAuth client secret |

If a full SMTP config is present, it takes precedence over Gmail. See the [Gmail setup guide](../admin/email.md) for the Google Cloud configuration steps.

## Other

| Variable | Description |
| --- | --- |
| `VAPID_PUBLIC_KEY` | Web Push VAPID public key (used for bonus-task push notifications) |
| `VAPID_PRIVATE_KEY` | Web Push VAPID private key |
