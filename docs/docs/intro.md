---
sidebar_position: 1
---

# Getting Started

Fungee-Hunt is a self-hosted, mobile-first scavenger-hunt platform. One **Game Master** creates a game and gets a six-character code; **players** join on their phones with that code; the Game Master builds teams, starts the clock, and reviews the photo and video proof that **Team Captains** submit. A public **viewer** shows the live leaderboard and photo feed on a TV or projector.

![Home page](/img/home.png)

## Roles

| Role | Where they live | What they do |
| --- | --- | --- |
| **Game Master (GM)** | `/gm/new` → `/gm/{gameId}/…` | Creates the game, manages players, teams, tasks, bonuses and rules, starts/ends the game, reviews submissions, sends announcements. |
| **Player** | `/play/{code}` | Joins with the game code, picks a name, and follows along with their team's task list. |
| **Team Captain** | `/play/{code}/tasks` | A player chosen (or auto-picked) to lead a team. Only the captain's phone can submit photo/video proof for the team. |
| **Spectator** | `/view/{code}` or `/spectator` | Watches the public leaderboard and submission feed on a TV or projector. |
| **Admin** | `/login` → `/admin` | Logs in with the server `GM_PASSPHRASE` to see every game, delete games, and change system-wide defaults. |

## A game from start to finish

1. **Create the game.** Anyone on the home page can click **CREATE GAME** and walk through the six-step wizard (name, schedule, return bonus, tasks, bonus task, food drive, email). The wizard gives the GM a game code and a GM dashboard link that is remembered on that device. See [Creating a game](./game-master/create-game.md).
2. **Players join.** Players type the code on the home page, enter their name, and say whether they have a car. They wait in the lobby until the GM assigns them to a team. See [Players](./gameplay/players.md).
3. **Build teams and tasks.** The GM opens **Teams → AUTO-CREATE** to split players into balanced teams (each with a captain and at least one driver), and adjusts the task list on the **Tasks** page. See [Players & Teams](./game-master/players-teams.md) and [Tasks](./game-master/tasks.md).
4. **Start the game.** The GM presses **START** on the dashboard. Captains see a short instruction popup and the task list unlocks.
5. **Teams complete tasks.** The captain expands a task, taps **Take Photo…** (or **Take Video…**), then **Submit**. See [Submitting proof](./gameplay/players.md#submitting-proof-team-captains).
6. **The GM reviews.** In **Game Master Approval** mode every submission lands on the **Submissions** page as `SUBMITTED` until the GM approves or rejects it with a reason. In **Automatic Approval** mode points are awarded immediately. See [Submissions](./game-master/submissions.md).
7. **Everyone watches.** The viewer at `/view/{code}` shows the leaderboard, a rolling collage of approved photos and a "latest updates" ticker. A TV can be paired from the GM header with a 6-digit code. See [Spectator view](./gameplay/spectator.md).
8. **End the game.** The GM presses **END**. The viewer switches to a download page, `/view/{code}/results` shows the final standings, `/play/{code}` becomes a public archive of every team's submissions, and the GM can generate a recap video. See [Ending a game](./game-master/ending.md).

## What you need to host it

- A machine that can run Docker or Docker Compose.
- A PostgreSQL database (the included Compose stack runs one for you).
- A public URL if you want players outside your LAN to join, or if you want Gmail OAuth to work.

## Quick start (Docker Compose)

```bash
docker compose up -d
docker compose exec fungee-hunt npm run db:migrate
```

Then open `http://localhost:3000`. The home page is public; the admin area at `/login` uses the `GM_PASSPHRASE` value (default `changeme` — change it before exposing the site).

See [Docker deployment](./deployment/docker.md), [Unraid](./deployment/unraid.md), and the [environment variables reference](./deployment/env.md) for platform-specific details.
