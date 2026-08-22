# Fungee-Hunt — Technical Design

This document lays out the technical architecture for Fungee-Hunt, based on the three role specs (`GameMaster.md`, `Manager.md`, `Member.md`). It covers language/stack choices, code structure, data model, real-time design, and how the app runs portably in any Docker environment.

---

## 1. Goals & Constraints

- **One website.** A single deployed app serves everyone — Game Master and players alike — at one hostname. There is no separate "admin site."
- Self-hosted, runs in **any** Docker environment via `docker compose up` — no code changes required between hosts.
- TLS/ingress is already handled externally (Cloudflared) — this design assumes plain HTTP between the reverse proxy and the app container.
- No app-store distribution. The whole site is a **PWA** — installable from a browser, no build/publish pipeline.
- All environment-specific values (domain, secrets, storage) come from env vars, never hardcoded or baked into build artifacts.

---

## 2. Stack

| Layer | Choice | Why |
|---|---|---|
| Language (client + server) | **TypeScript** everywhere | Shared types between frontend and backend for `Player`, `Team`, `Submission`, etc. — eliminates a whole class of client/server disagreement bugs. |
| Backend runtime | **Node.js** | Event-driven model fits a real-time, many-small-events app (joins, status flips, leaderboard updates). Also the most flexible/portable choice for a self-hosted Docker app — one runtime, huge ecosystem, easy to containerize. |
| Backend framework | **Express** | Thin REST layer for CRUD; nothing fancy needed. |
| Real-time | **Socket.io** | Lobby joins, task status changes, live leaderboard, submission review — all push-based. Socket.io over raw WebSockets for its reconnect/fallback handling, which matters on flaky event-day WiFi. |
| Database | **PostgreSQL** | Real relational data with real constraints ("exactly one Manager per team", team→player→submission chains). Not document-store territory. |
| ORM | **Prisma** | Type-safe queries matching the shared TS types; easy migrations for a project that will evolve. |
| Frontend framework | **Svelte (SvelteKit)** | Less framework ceremony, output closer to plain HTML/CSS/JS, and the "state changes → view updates" mental model maps well onto config/automation-style thinking. |
| Frontend structure | **Single SvelteKit app** | One website. Routing (not a separate build) decides whether a visitor sees the landing page, the Game Master console, or the player experience. See §3. |
| Frontend build target | **PWA** (manifest + service worker) | "Add to Home Screen" installable experience without app stores, for both the player and Game Master views. |
| Media capture | `<input type="file" accept="image/*|video/*" capture="environment">` | Hands off to native camera app — reliable across iOS/Android, retake built in, no `MediaRecorder` codec headaches. |
| Media storage | Local Docker volume | Zero-config, no external dependency — matches "runs in any Docker environment" goal. |
| Game Master access | **Shared passphrase** (one env var) | No user accounts. A single passphrase gates game creation/management so a random visitor to the public URL can't spin up or touch games. See §5. |

---

## 3. Repo / Service Structure

One website, one frontend package, one server package.

```
fungee-hunt/
├── docker-compose.yml
├── .env.example
├── packages/
│   ├── shared/              # shared TS types + zod schemas, imported by web + server
│   │   └── src/types/
│   │       ├── player.ts
│   │       ├── team.ts
│   │       ├── task.ts
│   │       ├── submission.ts
│   │       └── game.ts
│   │
│   ├── server/               # Node + Express + Socket.io + Prisma
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── config.ts             # env var loading + validation (fail loudly)
│   │   │   ├── db/
│   │   │   │   └── schema.prisma
│   │   │   ├── routes/
│   │   │   │   ├── auth.ts           # POST /api/auth/gm  (passphrase → GM session token)
│   │   │   │   ├── games.ts          # create/edit game, settings, start/end
│   │   │   │   ├── join.ts           # game-code join flow (App players)
│   │   │   │   ├── players.ts        # roster mgmt, add Offline player
│   │   │   │   ├── teams.ts          # create/edit team, assign Manager
│   │   │   │   ├── tasks.ts          # CRUD tasks
│   │   │   │   ├── submissions.ts    # submit/review proof
│   │   │   │   ├── bonuses.ts        # Return Time + Food Drive
│   │   │   │   └── config.ts         # GET /api/config → runtime frontend config
│   │   │   ├── sockets/
│   │   │   │   ├── lobby.ts          # join/leave events → Game Master lobby view
│   │   │   │   ├── submissions.ts    # status change push → Manager/Member/GM
│   │   │   │   └── leaderboard.ts    # score change push
│   │   │   ├── rules/                # server-enforced business rules (see §7)
│   │   │   │   ├── managerEligibility.ts   # only App players can be Manager
│   │   │   │   ├── submissionTransitions.ts
│   │   │   │   └── scoring.ts
│   │   │   └── middleware/
│   │   │       ├── auth.ts           # verify player session token per request/socket
│   │   │       └── gmAuth.ts         # verify GM session token (from passphrase) per request/socket
│   │   └── Dockerfile
│   │
│   └── web/                  # ONE SvelteKit app — landing, GM console, and player views
│       ├── src/routes/
│       │   ├── +page.svelte          # Landing: "Enter code" input + "Log In" (GM) button
│       │   ├── login/                # GM passphrase entry
│       │   ├── gm/
│       │   │   ├── +layout.svelte    # gates on GM session; redirects to /login if absent
│       │   │   ├── new/              # Create Game
│       │   │   ├── [gameId]/dashboard/
│       │   │   ├── [gameId]/tasks/
│       │   │   ├── [gameId]/teams/
│       │   │   ├── [gameId]/players/     # incl. Lobby view, Add Offline Player
│       │   │   ├── [gameId]/submissions/
│       │   │   ├── [gameId]/rules/
│       │   │   └── [gameId]/settings/
│       │   └── play/
│       │       ├── [code]/               # landing from a join link/QR — skips code entry
│       │       ├── [code]/name/          # display name entry
│       │       ├── [code]/lobby/         # waiting for team assignment
│       │       ├── [code]/tasks/         # task list + task card (proof controls shown iff role=Manager)
│       │       ├── [code]/rules/
│       │       └── [code]/team/          # roster + team naming
│       ├── public/
│       │   ├── manifest.json
│       │   └── service-worker.ts
│       └── Dockerfile
```

**Why one `web` app:** the landing page is the single entry point for everyone. Typing a code (or opening a join link/QR) routes into `/play/[code]/...`; clicking "Log In" routes into `/login` → `/gm/...`. Both are just routes within the same SvelteKit build — same styling system, same PWA manifest, one Docker image, one thing to deploy. Per the specs, "the Manager and Team Member views should look almost identical" — inside `/play`, the server returns a `role` (`manager` | `member`) for the authenticated player in that game, and the client conditionally renders proof-submission controls.

---

## 4. Landing Page & Routing

The root route (`/`) is the only thing a fresh visitor ever sees:

```text
FUNGEE-HUNT

Enter Game Code

[      7 4 K J P 2      ]

[ JOIN ]

──────────────────────────

[ LOG IN ]
```

- Typing a code and pressing **Join** → `/play/{code}/name` (or straight to `/play/{code}/lobby` / `/play/{code}/tasks` if a valid session token for that code already exists in `localStorage` — see §5).
- Opening a join link or scanning a QR code (`{current-host}/play/{code}`) lands directly on the name-entry screen, skipping manual code entry.
- Pressing **Log In** → `/login`, the Game Master passphrase screen.

No visible "Create Game" button on the landing page itself — creating a game is a Game Master action and lives behind the passphrase (`/gm/new`), not on the public landing page. This keeps the landing page to exactly the two things a player or a returning Game Master needs.

---

## 5. Authentication

Two independent, lightweight session systems — no user accounts for either.

### Game Master

- A single passphrase, set via `GM_PASSPHRASE` env var. No usernames, no per-person accounts.
- `/login` posts the passphrase to `POST /api/auth/gm`. On success, the server issues a signed **GM session token**, stored in `localStorage`.
- `middleware/gmAuth.ts` requires a valid GM session token on every `/api/gm/*` route and every Socket.io event a Game Master emits (create game, edit tasks, assign teams, review submissions, etc.).
- The GM session token is not tied to a specific game — once logged in, the Game Master can create and manage any number of games from the same session, matching "anyone with the passphrase runs the show" rather than per-game accounts.
- `/gm/+layout.svelte` checks for a valid token on load and redirects to `/login` if it's missing or rejected.

### Players (Manager & Member)

Unchanged from the earlier design — a Kahoot-style per-game join, not an account system:

1. Player opens `/play/{code}` (from a join link/QR) or types the code on the landing page.
2. Enters a display name → `POST /api/join` → server creates a `Player{type: APP}` and issues a **player session token** scoped to that specific game.
3. Token stored in `localStorage`, keyed by game code, so returning to `/play/{code}` resumes automatically without re-entering a name.
4. **Offline players** never authenticate at all — the Game Master adds them directly from the Players/Lobby screen (`POST /api/players`), and they exist purely as roster rows with no token, no login, no client.

Recovery if a player's token is lost (cache clear, new device): the Game Master's Players list has a **"Reissue join link"** action, generating a fresh one-time link for that existing `Player` row.

---

## 6. Data Model

```prisma
model Game {
  id              String   @id @default(cuid())
  code            String   @unique          // Kahoot-style join code, e.g. "74KJP2"
  name            String
  status          GameStatus @default(NOT_STARTED)
  startAt         DateTime?
  endAt           DateTime?
  submissionMode  SubmissionMode @default(AUTOMATIC)
  returnBonus     ReturnBonusConfig?
  foodDriveBonus  FoodDriveBonusConfig?
  players         Player[]
  teams           Team[]
  tasks           Task[]
  rulesSections   RuleSection[]
}

model Player {
  id           String     @id @default(cuid())
  gameId       String
  displayName  String
  type         PlayerType             // APP | OFFLINE
  sessionToken String?    @unique      // set on join; null for OFFLINE players
  joinedAt     DateTime   @default(now())
  team         Team?      @relation(fields: [teamId], references: [id])
  teamId       String?
  managerOf    Team?      @relation("TeamManager")
}

model Team {
  id         String   @id @default(cuid())
  gameId     String
  name       String?                    // nullable — unnamed until GM or Manager sets it
  managerId  String?  @unique
  manager    Player?  @relation("TeamManager", fields: [managerId], references: [id])
  members    Player[]
  submissions Submission[]
}

model Task {
  id          String    @id @default(cuid())
  gameId      String
  title       String
  description String
  points      Int
  proofType   ProofType // PHOTO | VIDEO | EITHER
  order       Int
}

model Submission {
  id          String   @id @default(cuid())
  taskId      String
  teamId      String
  proofUrl    String
  status      SubmissionStatus  // AVAILABLE is implicit (no row) | SUBMITTED | UNDER_REVIEW | COMPLETED | INCOMPLETE
  reason      String?           // Game Master's incomplete/rejection reason
  submittedAt DateTime @default(now())
  reviewedAt  DateTime?
  history     SubmissionHistoryEntry[]  // audit trail across resubmissions
}

enum GameStatus       { NOT_STARTED LIVE COMPLETED }
enum PlayerType       { APP OFFLINE }
enum ProofType         { PHOTO VIDEO EITHER }
enum SubmissionMode    { AUTOMATIC MANUAL }
enum SubmissionStatus  { SUBMITTED UNDER_REVIEW COMPLETED INCOMPLETE }
```

Bonus configs (`ReturnBonusConfig`, `FoodDriveBonusConfig`) and their award/confirmation records are separate tables following the same pattern as `Submission` — configured by the Game Master, awarded explicitly, immutable once confirmed.

---

## 7. Server-Enforced Business Rules

These are the pieces that must never be trusted to the client, regardless of how the UI presents them:

- **GM routes require a valid GM session token.** `middleware/gmAuth.ts` on every `/api/gm/*` route and GM-originated socket event — the passphrase gate is enforced server-side, not just by hiding the Log In button's destination.
- **Manager eligibility** — only `type: APP` players can be set as `Team.managerId`.
- **Submission status transitions** — a strict state machine, not an arbitrary field write:
  `(none) → SUBMITTED → [AUTOMATIC: COMPLETED] | [MANUAL: UNDER_REVIEW → COMPLETED | INCOMPLETE → SUBMITTED (resubmit)]`
  Enforce via `rules/submissionTransitions.ts`; reject any request that tries to skip a state.
- **Scoring** — task points, Food Drive (`items × pointsPerItem`), and Return Time Bonus are computed server-side only, never accepted as client-supplied values. `rules/scoring.ts` is the single source of truth the leaderboard, score breakdown, and final results all read from.
- **One Manager per team, one team per Manager** — DB-level constraint (`Team.managerId @unique`) plus an application check when reassigning.
- **Return/Food Drive immutability** — once confirmed/awarded, those records are insert-only; edits require a new explicit action, not an update to the original row (matches "recorded return timestamp should be immutable").
- **Visibility rules** — the Return Time Bonus window and Food Drive running counts must never be included in any API response sent to Manager/Member clients (not just hidden in the UI) — the specs are explicit these stay rules-only/GM-only.

---

## 8. Real-Time Events (Socket.io)

Rooms scoped per game (`game:{gameId}`), with role-based event visibility:

| Event | Emitted by | Received by |
|---|---|---|
| `player:joined` | join endpoint | Game Master (Lobby view) |
| `team:assigned` | GM team assignment | the assigned player (moves them out of Lobby) |
| `submission:updated` | submit / review actions | Team's Manager + Members, and Game Master |
| `leaderboard:updated` | scoring rule engine | all connected players (if GM setting allows) + Game Master |
| `game:statusChanged` | GM start/end game | everyone |

Socket auth uses the same session tokens as REST — a player's per-game token, or the Game Master's passphrase-issued token — validated server-side before joining any room. The socket layer isn't a separate trust boundary from the API.

---

## 9. Docker & Portability

### Environment variables (`.env.example`, shipped in repo — never the real `.env`)

```bash
# Game Master access
GM_PASSPHRASE=changeme                  # required, no default — gates game creation/management

# Database
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=fungeehunt
POSTGRES_USER=fungeehunt
POSTGRES_PASSWORD=changeme

# Auth
SESSION_SECRET=changeme                 # signs player + GM session tokens — required, no default

# Ports
API_PORT=3000
WEB_PORT=8080

# Media storage
UPLOAD_DIR=/data/uploads
```

### Key portability rules

- **Never bake config into a build.** The frontend doesn't get hardcoded `API_URL` baked in at `npm run build` time. Instead it uses the current host in the browser and the backend derives URLs from each request — the static build is identical regardless of who's hosting it.
- **Fail loudly on missing required config.** `server/src/config.ts` validates `SESSION_SECRET`, `GM_PASSPHRASE`, DB creds, etc. at startup and crashes with a clear message rather than starting in a broken state.
- **Named Docker volumes, not host bind-mounts**, in the shipped `docker-compose.yml` — portable across OSes/hosts. Anyone wanting a specific host path overrides it in their own `docker-compose.override.yml`.
- **Healthchecks + `condition: service_healthy`** on `depends_on`, since startup timing can't be assumed on unfamiliar hardware.

### `docker-compose.yml` (shape)

```yaml
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]

  server:
    build: ./packages/server
    env_file: .env
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - uploads_data:/data/uploads
    ports:
      - "${API_PORT}:3000"

  web:
    build: ./packages/web
    env_file: .env
    depends_on: [server]
    ports:
      - "${WEB_PORT}:80"

volumes:
  postgres_data:
  uploads_data:
```

One website, one `web` container. Cloudflared (already in place) fronts it on a single hostname and proxies API/socket traffic to `server` — no TLS termination needed inside this compose stack.

---

## 10. PWA Specifics

- `manifest.json`: `display: standalone`, icons, theme color — enables real "Add to Home Screen" behavior on iOS and Android, for both a player's `/play/{code}` shortcut and a Game Master's `/gm` shortcut.
- Service worker caches the app shell for fast reload; doesn't need offline-first data sync — the game is used live, online, during the event.
- No push notifications required for MVP; real-time-while-open (Socket.io) covers the actual need (status changes, team assignment). iOS Web Push (16.4+, home-screen launch only) is a possible later enhancement, not a dependency.
- Media capture via native `<input capture>` file picker — no custom camera UI, no `MediaRecorder` codec issues across iOS/Android.

---

## 11. Locked-In Decisions

- **One website:** a single SvelteKit app and single Docker image serve the landing page, the Game Master console, and the player experience — routing, not separate builds, decides what a visitor sees.
- **Frontend framework:** Svelte (SvelteKit).
- **Backend framework:** Express.
- **Game Master access:** a single shared passphrase (`GM_PASSPHRASE` env var), no user accounts. Anyone with the passphrase can create and manage any game.
- **Team renaming:** either the Manager or the Game Master can rename a team, at any time — no lock after assignment, no lock after game start.
- **Media storage:** local Docker volume only. No S3/object-storage support — keeps the stack dependency-free and matches the "runs in any Docker environment" goal without requiring an external service.
