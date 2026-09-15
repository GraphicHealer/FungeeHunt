---
sidebar_position: 7
---

# Ending a Game

Press **END** in the dashboard's **Game Controls** while the game is `LIVE`. The status becomes `COMPLETED`, the clock stops and Team Captains can no longer submit.

![Dashboard after the game ends](/img/gm-dashboard-ended.png)

## What changes when the game ends

- **Game Controls** gains a **RESULTS** button (opens `/view/{code}/results`) and a **GENERATE RECAP** button.
- If the Admin has set an auto-delete period, a red **Auto-Delete Scheduled** banner shows exactly when the game and all of its uploads will be permanently deleted.
- The **spectator view** (`/view/{code}`) plays the recap video once it is ready, then shows a QR code and URL for downloading every team's photos and videos, next to the final leaderboard.

  ![Viewer after the game ends](/img/viewer-ended.png)

- `/view/{code}/results` shows the **FINAL STANDINGS**.

  ![Final standings](/img/viewer-results.png)

- `/play/{code}` becomes a public **archive**: "Game over. Pick a team to download their submissions." Each team row expands to list the tasks they completed (or missed) with a **Download** link per photo/video.

  ![Post-game archive](/img/archive.png)

## Recap video

**GENERATE RECAP** renders an automatic highlight video from the approved photos and videos with background music. A progress bar shows *Generating recap… n%*; when it finishes you get a link to the file and the button changes to **RE-RENDER RECAP**. If it fails you'll see *Recap failed. Try again.*

## Auto-delete

Finished games (including their uploads) are deleted automatically *n* hours after their end time, where *n* is **Auto-delete games this many hours after they end** in **Admin → System Settings** (`0` = never). Download the recap and any submissions you want to keep before the time shown in the banner.
