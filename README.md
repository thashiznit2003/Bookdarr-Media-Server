# Bookdarr Media Server (BMS)

BMS is a secure, public‑facing media server that reads from Bookdarr’s Book Pool and serves audiobooks/ebooks to the Bookdarr Media Reader app. Bookdarr itself should remain private.

## Goals
- Public API + streaming (Plex‑like)
- Plex-inspired library UI for books
- Separate BMS user accounts (invite codes)
- Gmail SMTP password reset
- Offline downloads in Reader app
- Diagnostics required during development (opt‑in at release)
- Web app UI on port 9797

## Tech Stack
- Node.js + NestJS
- SQLite (dev), PostgreSQL (prod)
- Optional Redis for rate limiting

## Development
- Target OS: Ubuntu
- Port: 9797
- Docker later

## Configuration (env)
- `BOOKDARR_API_URL` (http/https, no trailing slash)
- `BOOKDARR_API_KEY`
- `BOOKDARR_BOOKPOOL_PATH` (default `/api/v1/user/library/pool`)
- `OPENLIBRARY_BASE_URL` (default `https://openlibrary.org`)
- `DB_TYPE` (`sqlite` default, or `postgres`)
- `DB_PATH` (sqlite file, default `data/bms.sqlite`)
- `DB_SYNC` (default true for sqlite, false for postgres)
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS`, `DB_NAME` (postgres)
- `DB_SSL` (default false; postgres only)
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`
- `DIAGNOSTICS_REQUIRED` (default true)
- `DIAGNOSTICS_REPO` (default `thashiznit2003/Bookdarr-Media-Diagnostics`)
- `DIAGNOSTICS_BRANCH` (default `main`)
- `DIAGNOSTICS_PATH` (default `bms`)
- `DIAGNOSTICS_TOKEN` (GitHub token for pushes)
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `JWT_ACCESS_TTL` (default `15m`)
- `JWT_REFRESH_TTL` (default `30d`)
- `RESET_TOKEN_TTL_MINUTES` (default `30`)
- `INVITE_CODES` (comma-separated)
- `PORT` (default 9797)

GET `/settings` returns a redacted settings summary for debugging.
POST `/diagnostics` pushes a diagnostics payload to the diagnostics repo (requires auth if JWT secrets are set).
GET `/library` returns the Book Pool with Open Library metadata.
Auth endpoints (invite-only signup):
- `GET /auth/setup` (first-run status)
- `POST /auth/setup` (create first user without invite)
- `POST /auth/signup`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `POST /auth/password/request`
- `POST /auth/password/reset`

Invite codes in `INVITE_CODES` are seeded into the database on startup so they
persist across restarts.

On first run, the web UI shows a setup wizard that creates the initial user.

Example flow (login + diagnostics):

```bash
curl -X POST http://localhost:9797/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"reader@example.com","password":"password123","inviteCode":"MYINVITE"}'
```

```bash
curl -X POST http://localhost:9797/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"reader@example.com","password":"password123"}'
```

```bash
curl -X POST http://localhost:9797/diagnostics \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{"event":"reader-startup","level":"info","source":"reader","data":{"version":"0.0.1"}}'
```

The root route (`/`) serves a temporary admin UI placeholder that reads
settings from `/settings`.

## Docs
- AGENTS.md
- HANDOFF.md
- CHECKLIST.md
- CHANGELOG.md

## License
MIT (see LICENSE)
