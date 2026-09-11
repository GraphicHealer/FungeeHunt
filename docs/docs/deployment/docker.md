---
sidebar_position: 1
---

# Docker Deployment

The root `Dockerfile` builds both the Express backend and the SvelteKit frontend into a single container.

```bash
docker compose up -d
```

For production, mount a volume at `UPLOAD_DIR` and back up the PostgreSQL database regularly.
