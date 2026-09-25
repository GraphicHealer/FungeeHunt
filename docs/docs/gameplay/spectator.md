---
sidebar_position: 3
---

# Spectator View

The spectator view is a full-screen page designed for a TV or projector at home base. It needs no login and updates live over a WebSocket.

## Opening the viewer

There are two ways to get a screen onto a game:

**Direct link.** Every game has a public viewer at `/view/{code}`. From the GM dashboard, click **SPECTATOR → Open** in the header to launch it in a new tab; the URL can be opened on any device.

**Pairing a TV.** On the TV, open the site and click **SPECTATOR** on the home page (or go to `/spectator`). The screen shows a six-digit pairing code and *Waiting to be paired...*. On the GM dashboard choose **SPECTATOR → Pair**, type the code into **Pair Spectator** and press **Connect** — the TV jumps to the game's viewer by itself. This is handy when the TV browser has no keyboard.

![Spectator pairing code](/img/spectator-pairing-code.png)

![Pair Spectator from the GM header](/img/gm-spectator-pair-modal.png)

## Before the game starts

The viewer shows the game name, a countdown *until the game starts*, and a QR code plus URL so latecomers can join.

## During the game

![Live viewer](/img/viewer-live.png)

- **LEADERBOARD** — every team ranked by points, updating as submissions are approved and bonuses are recorded.
- **Photo collage** — a rotating wall of the most recent approved photos and videos with team and task captions. It says *Waiting for the first submission…* until something is approved.
- **LATEST UPDATES** — a ticker of recent approvals.
- The join QR code and game code stay on screen so new players can still join.
- Game Master **announcements** pop up over the viewer just as they do on players' phones.

## After the game ends

When the Game Master presses **END**, the viewer plays the **EVENT RECAP** video (once the GM has generated it) and then switches to a download screen: *Scan the QR code or visit the URL below to download every team's photos and videos*, pointing at the public archive at `/play/{code}`, alongside the final leaderboard.

![Viewer after the game](/img/viewer-ended.png)

`/view/{code}/results` shows the **FINAL STANDINGS** as a simple ranked list, useful for announcing the winners.

![Final standings](/img/viewer-results.png)
