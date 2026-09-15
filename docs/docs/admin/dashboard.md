---
sidebar_position: 1
---

# Admin Dashboard

The Admin area is the only part of Fungee-Hunt behind a password. It is for the person who runs the server, not for individual Game Masters — GMs get their own per-game link from the [creation wizard](../game-master/create-game.md) and never need the passphrase.

## Logging in

Go to `/login` and enter the `GM_PASSPHRASE` environment variable value, then click **LOG IN**. The admin token is kept in the browser until you **Log Out**.

`!screenshot: fungeehunt-03-admin-login.png` — The /login page with the Passphrase field and LOG IN button.

## Games list

`/admin` lists every game on the server with its **Name**, **Game ID**, **Status**, **Players**, **Teams**, **Submissions** and **Storage** (disk used by uploads). *Games created from the main page will appear here.*

`!screenshot: fungeehunt-04-admin-dashboard.png` — The Admin Dashboard table with a few games listed.

Per-game actions:

- **Copy game URL** — copies the player join link.
- **Open GM dashboard in new tab** — opens the game's GM dashboard with full Game Master rights (the admin token is accepted on every GM page).
- **Delete game** — permanently removes the game, its teams, players, submissions and uploaded files.

The header has **System Settings** (see [Settings](./settings.md)) and **Log Out**.

## Gmail setup prompt

If `GMAIL_CLIENT_ID` / `GMAIL_CLIENT_SECRET` are set on the server but no Gmail account has been connected yet, the dashboard shows a **Gmail OAuth detected** dialog: *Would you like to finish setup and connect the sending account?* — **YES, CONNECT** starts the OAuth flow described in [Email setup](./email.md); **NO THANKS** hides the prompt on this device.

`!screenshot: fungeehunt-05-admin-gmail-prompt.png` — The "Gmail OAuth detected" dialog.
