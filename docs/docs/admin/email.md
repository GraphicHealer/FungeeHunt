---
sidebar_position: 1
---

# Email Setup

Fungee-Hunt can email Game Masters with:

- A copy of the game URL when a game is created.
- A reminder about 2 hours before the game starts.
- A warning shortly before the game is auto-deleted.

## SMTP

Set these environment variables:

| Variable | Description |
| --- | --- |
| `SMTP_HOST` | SMTP server host |
| `SMTP_PORT` | SMTP server port (465 or 587) |
| `SMTP_USER` | SMTP username |
| `SMTP_PASS` | SMTP password |
| `SMTP_FROM` | From address |
| `SMTP_SECURE` | `true` for implicit TLS (port 465) |

## Gmail OAuth

If SMTP is not configured, the app can send mail through a connected Gmail account.

1. Go to [console.cloud.google.com](https://console.cloud.google.com) and enable the **Gmail API**.
2. Create an **OAuth consent screen** (External) and add the sending Gmail account as a test user.
3. Create **OAuth credentials → Web application** with the redirect URI:
   ```
   https://<your-host>/api/gm/settings/email/callback
   ```
4. Set `GMAIL_CLIENT_ID` and `GMAIL_CLIENT_SECRET` in the container environment and restart.
5. Open `/admin` and click **Connect Gmail** in **Admin → Settings → Email**.

The refresh token and account address are stored in the database. SMTP takes precedence if both are configured.
