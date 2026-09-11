---
sidebar_position: 1
---

# Docker

Fungee-Hunt ships as a single container image (`ghcr.io/graphichealer/fungeehunt`) that contains both the Express backend and the built SvelteKit frontend.

## Quick start with Docker Compose

Create a `docker-compose.yml` next to your environment file and run `docker compose up -d`.

```yaml
services:
  postgres:
    image: postgres:18
    environment:
      POSTGRES_DB: fungeehunt
      POSTGRES_USER: fungeehunt
      POSTGRES_PASSWORD: changeme
    volumes:
      - postgres_data:/var/lib/postgresql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U fungeehunt"]

  fungee-hunt:
    image: ghcr.io/graphichealer/fungeehunt:latest
    depends_on:
      postgres:
        condition: service_healthy
    ports:
      - "3000:3000"
    environment:
      GM_PASSPHRASE: changeme
      # SESSION_SECRET: optional; a random secret is generated and stored in the database on first boot.
      # TRUST_PROXY: 1   # set to the number of reverse proxies in front of the app so rate limits see real client IPs
      PG_USER: fungeehunt
      PG_PASS: changeme
      PG_HOST: postgres
      PG_DATABASE: fungeehunt
      WEB_UI: 3000
      UPLOAD_DIR: /data/uploads
      LOG_LEVEL: debug
      TZ: America/New_York
    volumes:
      - uploads_data:/data/uploads

volumes:
  postgres_data:
  uploads_data:
```

On first run, deploy the Prisma migrations:

```powershell
docker compose exec fungee-hunt npm run db:migrate
```

Then open `http://localhost:3000` and log in with the `GM_PASSPHRASE` value.

## Pre-built image with `docker run`

If you already have a Postgres database, you can run the pre-built image directly without Compose. This example uses Docker Desktop on Windows (`host.docker.internal`); replace `PG_HOST` with your actual database host if running on a server.

```powershell
docker run -p 3000:3000 `
  -e GM_PASSPHRASE=changeme `
  -e PG_USER=fungeehunt `
  -e PG_PASS=changeme `
  -e PG_HOST=host.docker.internal `
  -e PG_DATABASE=fungeehunt `
  -e WEB_UI=3000 `
  -e UPLOAD_DIR=/data/uploads `
  -e LOG_LEVEL=debug `
  -e TZ=America/New_York `
  -v uploads_data:/data/uploads `
  ghcr.io/graphichealer/fungeehunt:latest
```

If you are not on Windows PowerShell, remove the backticks and put the command on one line, or use `\` line endings for Linux/macOS.

## Build the image locally

To build from the repo instead of pulling from GHCR:

```powershell
docker build -t fungeehunt .
docker run -p 3000:3000 -e ... fungeehunt
```

The `Dockerfile` in the repo root builds both the SvelteKit web app and the Express server into one image.

## Production tips

- Change `GM_PASSPHRASE` and `PG_PASS` to long random values.
- Set `PUBLIC_URL` to the public URL of your deployment if you want email links to work correctly.
- Back up the `postgres_data` and `uploads_data` volumes.
- Use a reverse proxy (Caddy, Nginx, Traefik, or Cloudflare Tunnel) for HTTPS in front of port `3000`.
