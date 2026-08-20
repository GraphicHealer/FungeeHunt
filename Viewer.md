# Fungee-Hunt — Public Viewer

## Role

The Public Viewer is a large-screen, read-only display meant for a TV or projector at the event. It is for spectators, bystanders, and staff who want to watch the game unfold. It is not a player interface.

The Public Viewer:

- Shows the current game status and remaining time.
- Shows a live leaderboard of all teams and their scores.
- Shows a live activity feed of the most recent completed and submitted tasks.
- Cycles through a dynamic slideshow of photos submitted by teams for completed tasks.
- Does not require login or interaction.
- Should remain clearly readable from across a room.

---

## Access

The Viewer is reached at a dedicated public route, for example `/view/{gameCode}`.

- No login or Game Code entry is needed for spectators.
- The Game Master can open this page on a connected TV or projector, or share the link to a device driving the display.
- It is read-only. No one can submit proof, change scores, or manage the game from this view.

---

## Layout

The display is divided into a few persistent panels optimized for a large screen:

- **Top bar** — game name, game status, and remaining time.
- **Side panel** — live team scoreboard.
- **Main area** — rotating slideshow of recent approved photos.
- **Lower strip or overlay** — live activity feed of the latest submissions and completions.

The design should be high-contrast with large type and generous spacing so that it is easy to read from a distance.

---

## Game Status

The top of the page always shows the game name and current state:

```text
FUNGEE-HUNT 2026

● LIVE                    01:42:37 REMAINING
```

---

## Live Leaderboard

A side panel shows every team sorted by total score:

```text
LEADERBOARD

1   THE FUNGI FRIENDS       1,450
2   SPORE LOSERS            1,250
3   MUSHROOM KINGDOM        1,100
4   MOREL SUPPORT             950
```

- Updates in real time as scores change.
- Shows rank, team name, and total points.
- May also show each team's completed task count.
- Should be readable from far away and not require scrolling on a typical leaderboard.

---

## Activity Feed

A live list of recent game events appears near the bottom or beside the slideshow:

```text
LATEST UPDATES

The Fungi Friends completed "Take a photo with a statue"    +150
Spore Losers submitted "Get a stranger to sing"              —
Mushroom Kingdom completed "Find something unusual"          +100
```

- Shows team name, task title, and points earned for completed tasks.
- For tasks still under review, show "submitted" with no points.
- Newest events appear at the top; older events scroll off or fade out.
- Updates via real-time socket events without refreshing the page.
- Keep wording short and clear for spectators.

---

## Photo Slideshow

The main area of the screen cycles through photos from completed task submissions.

- The MVP supports **photo** proof only. Video support may be added later.
- Each slide displays the submitted photo, the team name, and the task title.
- Slides advance automatically every few seconds and loop through the collection.
- Newly approved task photos can be added to the rotation as they arrive.

Example slide:

```text
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│   [ submitted photo ]                                        │
│                                                              │
│   THE FUNGI FRIENDS                                          │
│   Take a photo with a statue                                 │
│   +150 POINTS                                                │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## What to Show and What to Skip

- Show approved, completed task photos in the slideshow.
- Show submitted-but-not-yet-reviewed tasks in the activity feed only, with "submitted" wording.
- Do not show under-review or incomplete proof images in the slideshow.
- Do not expose Game Master-only information such as the Return Time Bonus window, Food Drive item counts, or review reasons.
- Do not show individual player names; use team names.

---

## Game End

When the game ends, the viewer can switch to a final results view:

```text
FUNGEE-HUNT 2026

✓ COMPLETED

FINAL STANDINGS

1   THE FUNGI FRIENDS       2,190
2   SPORE LOSERS            1,850
3   MUSHROOM KINGDOM        1,480
4   MOREL SUPPORT           1,120
```

The photo slideshow can continue to loop through all the approved photos from the game.

---

## Design Principles

- Large, high-contrast, TV- and projector-friendly styling.
- No user interaction required; it is a passive, always-on display.
- Read-only. The Viewer cannot modify game state.
- Real-time updates via Socket.io so spectators see progress as it happens.
- Photos only for the initial version. Video slideshow is a future enhancement.
- Use team names, not individual player names.
- Celebrate completed tasks; do not display rejected or pending proof as part of the slideshow.
- Keep Game Master-only information out of the spectator view.
