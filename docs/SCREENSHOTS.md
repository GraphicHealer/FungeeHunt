# Docs Screenshot Checklist

Screenshots live in `docs/static/img/` and are referenced from the Docusaurus pages in `docs/docs/` as `/img/<file>.png`. Pages that still need an image contain a `!screenshot: filename.png` placeholder — replace it with a Markdown image link once the file exists.

Capture conventions used so far: desktop/GM/viewer pages at **1600×1000**, player (phone) pages at **600×1100**.

## Still needed (Admin — requires the `GM_PASSPHRASE`)

1. `fungeehunt-03-admin-login.png`
   - **What to capture:** `/login` with the **Passphrase** field and **LOG IN** button.
   - **Used in:** `docs/docs/admin/dashboard.md`

2. `fungeehunt-04-admin-dashboard.png`
   - **What to capture:** `/admin` with a few games in the table (Name, Game ID, Status, Players, Teams, Submissions, Storage) and the row action icons.
   - **Used in:** `docs/docs/admin/dashboard.md`

3. `fungeehunt-05-admin-gmail-prompt.png`
   - **What to capture:** The **Gmail OAuth detected** dialog on `/admin` (only appears when Gmail credentials are set but no account is connected).
   - **Used in:** `docs/docs/admin/dashboard.md`

4. `fungeehunt-06-admin-settings-defaults.png`
   - **What to capture:** Top of `/admin/settings` — **Return Time Bonus Defaults**, **Food Drive Defaults**, **Game Cleanup**.
   - **Used in:** `docs/docs/admin/settings.md`

5. `fungeehunt-07-admin-settings-tasks.png`
   - **What to capture:** The **Default Tasks (CSV)** section with **Download Existing Tasks** / **Upload CSV**, plus the JSON editors below it.
   - **Used in:** `docs/docs/admin/settings.md`

6. `fungeehunt-01-admin-settings-email.png`
   - **What to capture:** The **Email** section showing the status line, **CONNECT GMAIL** and **SEND TEST**.
   - **Used in:** `docs/docs/admin/settings.md`, `docs/docs/admin/email.md`

7. `fungeehunt-02-admin-email-connected.png`
   - **What to capture:** The same section after Gmail has been connected (*A Gmail account is connected.*).
   - **Used in:** `docs/docs/admin/email.md`

8. `fungeehunt-08-admin-settings-backup.png`
   - **What to capture:** The **Welcome Screen** and **Backup & Restore** sections.
   - **Used in:** `docs/docs/admin/settings.md`

## Still needed (Gmail OAuth — Google Cloud Console)

All taken from the Google Cloud project used by Fungee-Hunt. Used in `docs/docs/admin/email.md`.

9. `gmail-01-project.png` — project selector / top bar showing the project name.
10. `gmail-02-gmail-api-enabled.png` — Gmail API page with **Enabled** visible.
11. `gmail-03-consent-scopes.png` — **Add or remove scopes** with `https://mail.google.com/` selected.
12. `gmail-04-test-users.png` — **Test users** list with the sending address.
13. `gmail-05-create-client.png` — **Create OAuth client ID** form, **Web application**, redirect URI `https://<your-host>/api/gm/settings/email/callback`.
14. `gmail-06-client-secret.png` — client ID / secret popup. **Redact the secret before publishing.**

## Still needed (Deployment)

15. `deployment-01-docker-compose.png` — terminal running `docker compose up -d` with `postgres` and `fungee-hunt` starting. Used in `docs/docs/deployment/docker.md`.
16. `deployment-02-unraid-template.png` — the Fungee-Hunt template on the Unraid Docker page. Used in `docs/docs/deployment/unraid.md`.

## Done

| File | Shows | Used in |
| --- | --- | --- |
| `home.png` | Home page: game code, JOIN GAME, SPECTATOR, CREATE GAME | intro |
| `gm-wizard-tour-prompt.png`, `gm-wizard-existing-game.png` | Wizard tutorial prompt; "already have a game" screen | game-master/create-game |
| `gm-wizard-1-basics.png` … `gm-wizard-6-email.png` | The six wizard steps | game-master/create-game |
| `gm-dashboard-live.png` | GM dashboard during a LIVE game | game-master/dashboard, README |
| `gm-spectator-menu.png`, `gm-spectator-pair-modal.png` | SPECTATOR menu and Pair Spectator modal | game-master/dashboard, gameplay/spectator |
| `gm-announce-modal.png` | Send Announcement modal | game-master/dashboard |
| `gm-tasks.png`, `gm-tasks-add-menu.png`, `gm-tasks-select-library.png`, `gm-tasks-custom.png`, `gm-tasks-import-csv.png` | Tasks page and its add flows | game-master/tasks |
| `gm-players.png`, `gm-players-add-offline.png` | Players page; Add Offline Player modal | game-master/players-teams |
| `gm-teams.png`, `gm-teams-auto-create.png` | Teams page; Auto-create modal | game-master/players-teams |
| `gm-submissions.png`, `gm-submission-review.png`, `gm-submission-reject.png` | Submissions list; review modal; reject with reason | game-master/submissions |
| `gm-bonuses.png`, `gm-rules.png`, `gm-settings.png` | Bonuses, Rules and Settings pages | game-master/bonuses-rules-settings |
| `gm-dashboard-ended.png` | Dashboard after END (auto-delete banner, RESULTS, GENERATE RECAP) | game-master/ending |
| `viewer-live.png`, `viewer-ended.png`, `viewer-results.png` | Public viewer live, after the game, and final standings | gameplay/spectator, game-master/ending, README |
| `spectator-pairing-code.png` | `/spectator` pairing-code screen | gameplay/spectator |
| `archive.png` | `/play/{code}` post-game download archive | game-master/ending |
| `player-01-enter-code.png`, `player-02-name.png`, `player-03-lobby-waiting.png` | Join flow and lobby | gameplay/players |
| `player-task-list.png`, `player-task-expanded.png`, `player-team.png`, `player-rules.png` | Non-captain team member views | gameplay/players, gameplay/teams |
| `captain-01-instructions-popup.png`, `captain-02-task-list.png`, `captain-task-expanded.png`, `captain-photo-loaded.png`, `captain-after-submit.png`, `captain-multi-photo-task.png`, `captain-task-rejected.png` | Team Captain submission flow | gameplay/players, gameplay/teams, README |
