# Fungee-Hunt

A self-hosted scavenger-hunt web app for Game Masters, Managers, Members, and public Viewers.

## Quick start with Docker

1. Copy `.env.example` to `.env` and fill in the values.
2. Make sure `POSTGRES_HOST=postgres` and `DATABASE_URL` points at the compose Postgres service.
3. Run:

```powershell
docker-compose up --build
```

The app will be available on the port you set in `API_PORT` (default `3000`).

The compose file includes a `postgres` service, so this is the easiest one-command option.

## Local development

### Requirements

- Node.js 20+
- PostgreSQL 16 running locally (or in Docker)

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
PUBLIC_URL=http://localhost:3000
GM_PASSPHRASE=your-secret-gm-passphrase
SESSION_SECRET=any-long-random-string

POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=fungeehunt
POSTGRES_USER=fungeehunt
POSTGRES_PASSWORD=your-local-postgres-password
DATABASE_URL=postgresql://fungeehunt:your-local-postgres-password@localhost:5432/fungeehunt

API_PORT=3000
UPLOAD_DIR=./uploads
```

Create a local `uploads` directory if `UPLOAD_DIR` is a relative path:

```powershell
mkdir uploads
```

### 3. Generate and run Prisma migrations

```powershell
npx prisma migrate dev --schema packages/server/src/db/schema.prisma
npx prisma generate --schema packages/server/src/db/schema.prisma
```

### 4. Start the server

```powershell
npm run dev --workspace=@fungeehunt/server
```

The server runs on `http://localhost:3000` and will auto-reload on changes.

### 5. Start the web app

In a second terminal:

```powershell
npm run dev --workspace=@fungeehunt/web
```

The Vite dev server runs on `http://localhost:5173` and proxies `/api` and `/socket.io` to the server.

## Testing a game

1. Open `http://localhost:5173`.
2. Click "Game Master Login" and enter your `GM_PASSPHRASE`.
3. Create a game. Copy the game code and join URL.
4. In a second browser/incognito window, go to the join URL or `http://localhost:5173/play/{CODE}`.
5. Enter a player name to join.
6. Back in the GM dashboard, assign the player to a team and make them Manager.
7. As the player, submit a photo for a task.
8. Approve it in the GM Submissions page (unless the game is in automatic mode).
9. Open the public viewer at `http://localhost:5173/view/{CODE}` to see the scoreboard.

## Common commands

```powershell
# Run Prisma migrations
npx prisma migrate dev --schema packages/server/src/db/schema.prisma

# Generate Prisma client
npx prisma generate --schema packages/server/src/db/schema.prisma

# Start the server for local development
npx tsx packages/server/src/index.ts

# Start the SvelteKit dev server
npm run dev --workspace=@fungeehunt/web

# Build the web app for production
npm run build --workspace=@fungeehunt/web
```

## Production notes

- The Docker build produces a single `fungee-hunt` container. It expects an external Postgres container or service.
- Only the `fungee-hunt` container needs a public port exposed.
- Uploaded media is stored in the `UPLOAD_DIR` volume.
