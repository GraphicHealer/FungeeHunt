# Docs Screenshot Checklist

This file lists the screenshots referenced in the docs. Add them to `docs/static/img/` and replace the `!screenshot: filename.png` placeholders with real Markdown image links.

## Gmail OAuth setup

All of these are taken from the Google Cloud Console for the same project used by Fungee-Hunt.

1. `gmail-01-project.png`
   - **What to capture:** Google Cloud project selector or the top navigation bar of the console showing the project name.
   - **Used in:** `docs/docs/admin/email.md`

2. `gmail-02-gmail-api-enabled.png`
   - **What to capture:** The Gmail API product page with the **Enabled** status visible.
   - **Used in:** `docs/docs/admin/email.md`

3. `gmail-03-consent-scopes.png`
   - **What to capture:** The **OAuth consent screen → Scopes** page with `https://mail.google.com/` selected in the list.
   - **Used in:** `docs/docs/admin/email.md`

4. `gmail-04-test-users.png`
   - **What to capture:** The **Test users** section with the sending Gmail address added.
   - **Used in:** `docs/docs/admin/email.md`

5. `gmail-05-create-client.png`
   - **What to capture:** The **Create OAuth client ID** form with **Web application** selected and the redirect URI (`https://<your-host>/api/gm/settings/email/callback`) filled in.
   - **Used in:** `docs/docs/admin/email.md`

6. `gmail-06-client-secret.png`
   - **What to capture:** The client ID and client secret popup after creating the credentials.
   - **Warning:** Redact or blur the client secret before publishing. You only need the client ID visible for the docs; the secret should remain private.
   - **Used in:** `docs/docs/admin/email.md`

## Fungee-Hunt UI

7. `fungeehunt-01-admin-settings-email.png`
   - **What to capture:** The `/admin/settings` page, showing the **Email** section with the **Connect Gmail** and **SEND TEST** buttons.
   - **Used in:** `docs/docs/admin/email.md`

8. `fungeehunt-02-admin-email-connected.png`
   - **What to capture:** The same `/admin/settings` page after Gmail has been connected, showing the connected status.
   - **Used in:** `docs/docs/admin/email.md`

## Deployment

9. `deployment-01-docker-compose.png`
   - **What to capture:** A terminal window running `docker compose up -d` for Fungee-Hunt, with both `postgres` and `fungee-hunt` services starting.
   - **Used in:** `docs/docs/deployment/docker.md`

10. `deployment-02-unraid-template.png`
    - **What to capture:** The Fungee-Hunt template shown in the Unraid Docker page, with the user adding the container.
    - **Used in:** `docs/docs/deployment/unraid.md`

## Gameplay

11. `gameplay-01-captain-submit.png`
    - **What to capture:** The player/captain phone screen showing a task and the photo/video upload button.
    - **Used in:** `docs/docs/gameplay/players.md`

12. `gameplay-02-spectator-view.png`
    - **What to capture:** A TV or monitor showing the live spectator scoreboard and photo collage.
    - **Used in:** `docs/docs/gameplay/spectator.md`
