---
sidebar_position: 2
---

# Dashboard

`/gm/{gameId}/dashboard` is the Game Master's home during the hunt.

![GM dashboard while the game is live](/img/gm-dashboard-live.png)

## Header

The header is shared by every GM page:

- **← Game Board** returns to the home page.
- Game name, **game code** and current status (`NOT STARTED`, `LIVE`, `COMPLETED`).
- The live **clock** and the scheduled start/end times.
- **GM LINK** copies a URL that opens this dashboard on any device. Keep it private — it grants full control of the game.
- **SPECTATOR** opens a small menu to open the public viewer or pair a TV (see [Spectator view](../gameplay/spectator.md)).

![Spectator menu](/img/gm-spectator-menu.png)

The left sidebar links to **Dashboard**, **Players**, **Teams**, **Tasks**, **Submissions**, **Bonuses**, **Rules** and **Settings**. The chat bubble in the bottom-right corner opens the GM ↔ team chat.

## Leaderboard and Submission Feed

The **Leaderboard** ranks teams by points and updates in real time. The **Submission Feed** shows the newest photo/video submissions with team, task, points and status. Click a card to open the same review modal used on the [Submissions](./submissions.md) page.

## Right-hand panels

### ANNOUNCE

Sends a pop-up message to players and to the spectator screen. Tick **All teams** or **Select teams** to choose who receives it, and **Captains only** to reach just the Team Captains.

![Send announcement](/img/gm-announce-modal.png)

### PRINT TASKS & RULES

Opens `/gm/{gameId}/print`, a printer-friendly page with the full task list and rules for paper copies. Use **PRINT** or **CLOSE**.

### Game Controls

- Status and clock.
- The **game code** with a **COPY** button that copies the player join URL.
- **START** (only while `NOT STARTED`) — sets the game `LIVE`, starts the clock and unlocks the task list for Team Captains.
- **END** (only while `LIVE`) — sets the game `COMPLETED`. See [Ending a game](./ending.md).
- After the game ends: **RESULTS** and **GENERATE RECAP**.

### Return Bonus

Only shown when the return bonus is enabled. Lists each team with a **MARK** button. The button is active only inside the return window; pressing it awards the bonus points to that team.

### Food Drive

Only shown when the food drive is enabled. Enter the number of items each team collected and press **SAVE**; the team's points are recalculated from *points per item*.
