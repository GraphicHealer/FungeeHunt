# Fungee-Hunt

A self-hosted, mobile-first scavenger-hunt platform built for Game Masters, team managers, players, and public spectators. Run it on a server or a local machine with Docker.

## What it does

- **Game Master** creates a game, sets the rules, builds a task list, manages players/teams, reviews submissions, and starts the clock.
- **Players** join on their phones with a game code, see their tasks, and submit photo or video proof.
- **Managers** are app players assigned to lead a team. The GM can auto-create balanced teams that each include at least one manager and one driver.
- **Spectators** watch a live scoreboard and photo feed on a TV or projector.

## Features

- Real-time updates via Socket.io (scores, submissions, game status, viewer feed)
- Task categories and random, category-balanced task selection when a game is created
- A guaranteed `Team Photo` task that is always task #1
- Car/driver tracking for players and auto-team creation with driver/manager constraints
- Photo/video proof submissions (one proof type per task)
- GM printout page for offline players who are not using phones
- Public viewer / scoreboard screen
- Optional return-time bonus and food-drive bonus
- Guided GM onboarding tour
- Docker deployment with a single app container and a PostgreSQL container

## Quick start with Docker

All environment variables are in `docker-compose.yml`. Review/change defaults, then run:

```powershell
docker-compose up --build
```

The app will be available at `http://localhost:3000`.

To log in as the Game Master, use the `GM_PASSPHRASE` value from `docker-compose.yml` (default is `changeme`).

## Local development

### Requirements

- Node.js 20+
- PostgreSQL 15+ running locally or in Docker

### 1. Install dependencies

```powershell
npm install
```

### 2. Set up environment

```powershell
cp .env.example .env
```

Edit `.env` for local dev:

```text
GM_PASSPHRASE=your-secret-gm-passphrase
SESSION_SECRET=any-long-random-string
DATABASE_URL=postgresql://fungeehunt:your-local-postgres-password@localhost:5432/fungeehunt
WEB_UI=3000
UPLOAD_DIR=./uploads
```

Create the uploads directory:

```powershell
mkdir uploads
```

### 3. Run Prisma migrations

```powershell
npx prisma migrate dev --schema packages/server/src/db/schema.prisma
npx prisma generate --schema packages/server/src/db/schema.prisma
```

### 4. Start the server

```powershell
npm run dev --workspace=@fungeehunt/server
```

The API runs on `http://localhost:3000` and auto-reloads on changes.

### 5. Start the web app

In a second terminal:

```powershell
npm run dev --workspace=@fungeehunt/web
```

The Vite dev server runs on `http://localhost:5173` and proxies `/api` and `/socket.io` to the server.

## Trying a game

1. Open `http://localhost:5173` (dev) or `http://localhost:3000` (Docker).
2. Click **Game Master Login** and enter your `GM_PASSPHRASE`.
3. Create a game through the wizard. You can choose how many tasks to include; the app randomly balances categories and always places one `Team Photo` task as #1.
4. Copy the join link/code from the dashboard.
5. In another browser or incognito window, open `/play/{CODE}` and enter a player name. The onboarding asks whether the player has a car they can drive.
6. Back in the GM dashboard, open **Teams** and click **AUTO-CREATE TEAMS** (or build them manually). Every team gets one manager and one driver.
7. As the manager, the app will show a popup when the game starts explaining their role.
8. Submit photo or video proof for tasks; the GM reviews submissions unless the game is in automatic approval mode.
9. Open `/view/{CODE}` for the public scoreboard and photo feed.

## Common commands

```powershell
# Run Prisma migrations
dotenv -e .env -- npx prisma migrate dev --schema packages/server/src/db/schema.prisma

# Generate Prisma client
npx prisma generate --schema packages/server/src/db/schema.prisma

# Start the server for local development
npm run dev --workspace=@fungeehunt/server

# Start the SvelteKit dev server
npm run dev --workspace=@fungeehunt/web

# Build the web app for production
npm run build --workspace=@fungeehunt/web
```

## Project structure

```text
.
├── packages/server   # Express + Prisma + Socket.io API
├── packages/web      # SvelteKit PWA frontend
├── packages/shared   # Shared TypeScript types
├── docker-compose.yml
└── Dockerfile
```

## Important environment variables

| Variable | Purpose |
| --- | --- |
| `GM_PASSPHRASE` | Passphrase used to log in as Game Master |
| `SESSION_SECRET` | Secret for GM JWT signing |
| `DATABASE_URL` | PostgreSQL connection string |
| `UPLOAD_DIR` | Where player uploads are stored |
| `WEB_UI` | Port the server listens on |

## Production notes

- The Docker build creates one `fungee-hunt` container; `docker-compose.yml` also runs PostgreSQL and a persistent uploads volume.
- Only the `fungee-hunt` container needs a public port exposed.
- Uploaded media is stored in the `UPLOAD_DIR` volume and served by the app.
- Default tasks and task categories are seeded on first run from `packages/server/src/lib/defaults.ts`. Update them in **System Settings** after the first launch, or reset the database to re-seed.
