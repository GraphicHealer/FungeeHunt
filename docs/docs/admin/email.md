---
sidebar_position: 1
---

# Email Setup

Fungee-Hunt can email Game Masters with:

- A copy of the game URL when a game is created.
- A reminder about 2 hours before the game starts.
- A warning shortly before the game is auto-deleted.

Email is configured entirely via environment variables. There are no UI controls for SMTP passwords or Gmail credentials.

## Choose a sending method

- **SMTP** — simplest if you already have an SMTP server. Set `SMTP_HOST`, `SMTP_PORT`, `SMTP_FROM`, and optionally `SMTP_USER`/`SMTP_PASS`.
- **Gmail OAuth** — useful if you want to send from a Gmail account without a separate SMTP relay.

If a full SMTP config is present, it always takes precedence over Gmail.

## SMTP example

```bash
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=fungeehunt@example.com
SMTP_PASS=your-app-password
SMTP_FROM="Fungee-Hunt <fungeehunt@example.com>"
SMTP_SECURE=false
```

For port 465, set `SMTP_SECURE=true`.

## Gmail OAuth step-by-step

### 1. Create a Google Cloud project

1. Open [console.cloud.google.com](https://console.cloud.google.com).
2. Create a new project or select an existing one.

`!screenshot: gmail-01-project.png` — Google Cloud project selector, with the selected project name visible.

### 2. Enable the Gmail API

1. Go to **APIs & Services → Library**.
2. Search for **Gmail API** and click **Enable**.

`!screenshot: gmail-02-gmail-api-enabled.png` — Gmail API page showing the **Enabled**/green checkmark.

### 3. Configure the OAuth consent screen

1. Go to **APIs & Services → OAuth consent screen**.
2. Choose **External** and click **Create**.
3. Fill in the **App name** and **User support email**.
4. In **Scopes**, click **Add or remove scopes**, then add:
   ```
   https://mail.google.com/
   ```
   This is the full Gmail access scope. It is required to send mail.
5. In **Test users**, add the Gmail address you will send from (e.g. `fungeehunt@gmail.com`). While the app is in **Testing**, only test users can complete the OAuth consent.

`!screenshot: gmail-03-consent-scopes.png` — The **Add or remove scopes** screen showing `https://mail.google.com/` selected.

`!screenshot: gmail-04-test-users.png` — The **Test users** list with the sending address added.

### 4. Create OAuth credentials

1. Go to **APIs & Services → Credentials**.
2. Click **Create Credentials → OAuth client ID**.
3. Select **Web application** as the type.
4. Under **Authorized redirect URIs**, add:
   ```
   https://<your-host>/api/gm/settings/email/callback
   ```
   Use the exact public URL of your Fungee-Hunt deployment, including the port if it is non-standard.
5. Click **Create**.
6. A popup shows the **Client ID** and **Client Secret**. Save both.

`!screenshot: gmail-05-create-client.png` — The **Create OAuth client ID** form with **Web application** selected and the redirect URI added.

`!screenshot: gmail-06-client-secret.png` — The client ID and client secret popup after creation. **Redact the secret before publishing this screenshot.**

### 5. Set the environment variables

Add these to your Docker Compose, Unraid template, or `docker run` command:

```bash
GMAIL_CLIENT_ID=your-client-id.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=your-client-secret
```

Then restart the container.

### 6. Connect the Gmail account in Fungee-Hunt

1. Open `/admin` in your browser and log in with the `GM_PASSPHRASE`.
2. Click **Admin → Settings**.
3. In the **Email** section, click **Connect Gmail**.
4. Sign in with the sending Gmail account when Google prompts you.
5. You will be redirected back to `/admin/settings?email=connected` if it succeeds.

`!screenshot: fungeehunt-01-admin-settings-email.png` — The Fungee-Hunt **Admin → Settings → Email** section showing **Connect Gmail** and **Send Test** buttons.

`!screenshot: fungeehunt-02-admin-email-connected.png` — The same section after a successful connection, showing the connected status.

### 7. Send a test email

1. In the **Email** section, enter an address in **Send a test email to…**.
2. Click **SEND TEST**.
3. Check the inbox. You should receive a styled email from Fungee-Hunt.

## Troubleshooting

| Issue | Likely cause |
| --- | --- |
| `access_denied` from Google | The signed-in Google account is not in **Test users** on the OAuth consent screen. |
| `Email is not configured` after connecting | The OAuth callback could not resolve the account address. Make sure the Gmail API is enabled and re-run **Connect Gmail**. |
| Emails not arriving | Check the container logs. SMTP is preferred over Gmail if both are configured. |
| `Gmail connect link expired` | The OAuth state is only valid for 5 minutes. Click **Connect Gmail** again. |
