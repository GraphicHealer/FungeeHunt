---
sidebar_position: 2
---

# System Settings

`/admin/settings` (**Admin → System Settings**) holds the server-wide defaults that every new game starts from. Change the values you want and press **SAVE SETTINGS**; **BACK TO ADMIN** returns to the games list.

`!screenshot: fungeehunt-06-admin-settings-defaults.png` — The top of /admin/settings showing the Return Time Bonus and Food Drive default sections.

## Return Time Bonus Defaults

- **Default window length (minutes)**
- **Default points**

Pre-fills step 2 of the [creation wizard](../game-master/create-game.md#step-2--return-bonus).

## Food Drive Defaults

- **Default points per item**
- **Default permissible items**
- **Default suggested items**

Pre-fills step 5 of the wizard and the players' **FOOD DRIVE** card.

## Game Cleanup

**Auto-delete games this many hours after they end (0 = never).** Deletes the game along with its teams, players, submissions and uploaded files this many hours after the game's scheduled end time. Games with no end time are never auto-deleted. Completed games show the exact deletion time on the GM dashboard (see [Ending a game](../game-master/ending.md#auto-delete)).

## Default Tasks (CSV)

The task library used by the wizard's random draw, **Select task** on the Tasks page and the built-in **Bonus Task** picker.

- **Download Existing Tasks** exports the current library as `fungeehunt-default-tasks.csv`.
- **Upload CSV** replaces the whole library with the uploaded file.

Columns: `title, description, points, proofType, photoCount, category` — `proofType` is `PHOTO`, `VIDEO` or `PHOTOS`; `category` groups tasks so the wizard can draw a mix.

`!screenshot: fungeehunt-07-admin-settings-tasks.png` — The Default Tasks (CSV) section with Download Existing Tasks / Upload CSV.

## Default Task Categories (JSON)

A JSON array of category names (e.g. `["Team Photo", "People", "History", "Pranks", …]`) offered when editing tasks. When the wizard generates a game it takes one task from each category in turn (round-robin) so the mix is varied.

## Default Rules (JSON)

The rule sections copied into every new game (editable per game on the GM **Rules** page). Edit as JSON.

## Email

Shows the current email status — *SMTP is configured and will be used*, *A Gmail account is connected*, *Gmail credentials are set on the server but no account is connected yet*, or *Email is not configured*. When Gmail credentials exist you get **CONNECT GMAIL** / **RECONNECT GMAIL**; when sending is possible you can enter an address in **Send a test email to…** and press **SEND TEST**. Full walkthrough: [Email setup](./email.md).

`!screenshot: fungeehunt-01-admin-settings-email.png` — The Email section with the status line, CONNECT GMAIL and SEND TEST.

## Welcome Screen

**SHOW WELCOME SCREEN AGAIN** re-displays the first-run *Welcome to Fungee-Hunt* pop-up on the next page load. The new-game tutorial is not controlled here — the [creation wizard](../game-master/create-game.md#tutorial-prompt) offers it on every device that has not yet declined or finished it.

## Backup & Restore

**Export Settings** downloads every setting above as one JSON file; **Import Settings** restores from a previous export. Server-managed secrets (session secret, push keys) are not included.

`!screenshot: fungeehunt-08-admin-settings-backup.png` — The Backup & Restore section.
