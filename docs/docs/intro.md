---
sidebar_position: 1
---

# Getting Started

Fungee-Hunt is a self-hosted, mobile-first scavenger-hunt platform built with SvelteKit, Express, Prisma/PostgreSQL, Socket.IO, and Docker.

## What you need

- A machine that can run Docker or Docker Compose.
- A PostgreSQL database (the included Compose stack runs one for you).
- A public URL if you want to use Gmail OAuth or receive mobile traffic from players outside your LAN.

## Quick start (Docker Compose)

```bash
docker compose up -d
```

Then open `http://localhost:3000`.

See [Docker deployment](./deployment/docker.md), [Unraid](./deployment/unraid.md), and the [environment variables reference](./deployment/env.md) for platform-specific details.
