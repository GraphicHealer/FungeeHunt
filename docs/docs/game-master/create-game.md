---
sidebar_position: 1
---

# Creating a Game

Click **CREATE GAME** on the home page (or go to `/gm/new`). No login is needed — the Game Master role is a per-game token that is stored in the browser that created the game.

## Tutorial prompt

The first time you open the wizard on a device you are offered a guided tour. Choose **YES** to be walked through the wizard and dashboard, or **NO** to skip it. You can bring the tour back later from **Admin → System Settings → RE-ENABLE TUTORIAL**.

![Tutorial prompt](/img/gm-wizard-tour-prompt.png)

If this device already has a game, the wizard first offers to **OPEN** it or **START A NEW GAME**.

![Existing game on this device](/img/gm-wizard-existing-game.png)

## Step 1 — Basics

- **Game Name**
- **Date**, **Start Time**, **End Time** — the game clock and the dashboard countdown are based on these.
- **Submission Review**
  - **Automatic Approval** — every submission is immediately marked completed and points are awarded.
  - **Game Master Approval** — submissions wait on the [Submissions](./submissions.md) page until you approve or reject them.

![Step 1 – Basics](/img/gm-wizard-1-basics.png)

## Step 2 — Return Bonus

Optional. Teams that report back to the Game Master inside a time window earn bonus points.

- **Window Start Time** and **Window Length (minutes)** — the computed window is shown below the fields. **RANDOMIZE** picks a random window inside the game schedule so teams can't plan around it.
- **Points** awarded to each team that makes it back in time.

During the game you mark returns from the **Return Bonus** panel on the dashboard.

![Step 2 – Return Bonus](/img/gm-wizard-2-return-bonus.png)

## Step 3 — Tasks

Choose **how many tasks** to generate for this game. A random mix is drawn from the default task library (by category), and a **Team Photo** task is always task #1. You can add, remove, reorder and edit tasks afterwards on the [Tasks](./tasks.md) page.

If the library is empty the wizard tells you to add default tasks in **Admin → System Settings** first.

![Step 3 – Tasks](/img/gm-wizard-3-tasks.png)

## Step 4 — Bonus Task

Optional. A single limited-time task that is only available between **Window Start Time** and **Window End Time**. Pick the **Bonus Task** from the library (or write one on the [Bonuses](./bonuses-rules-settings.md) page later).

![Step 4 – Bonus Task](/img/gm-wizard-4-bonus-task.png)

## Step 5 — Food Drive

Optional. Teams collect donated items during the hunt and earn **Points Per Item**. **Permissible Items** and **Suggested Items** are shown to players on their Rules page. You record each team's item count from the **Food Drive** panel on the dashboard.

![Step 5 – Food Drive](/img/gm-wizard-5-food-drive.png)

## Step 6 — Email Notifications

Optionally enter **Your Email** to receive game notifications. This requires email to be configured on the server (see [Email setup](../admin/email.md)); the field is skipped otherwise.

![Step 6 – Email](/img/gm-wizard-6-email.png)

Click **CREATE GAME**. You land on the [Dashboard](./dashboard.md) with the new six-character game code.

:::tip Keep your GM link
The GM token lives in the browser's local storage. Use **GM LINK** in the dashboard header to copy a link that opens the dashboard on another device. Anyone with that link has full Game Master control.
:::
