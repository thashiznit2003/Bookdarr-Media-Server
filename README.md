# Bookdarr Media Server (BMS)

BMS is a secure, public‑facing media server that reads from Bookdarr’s Book Pool and serves audiobooks/ebooks to the Bookdarr Media Reader app. Bookdarr itself should remain private.

## Goals
- Public API + streaming (Plex‑like)
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
- `PORT` (default 9797)

GET `/settings` returns a redacted settings summary for debugging.
POST `/diagnostics` pushes a diagnostics payload to the diagnostics repo.

The root route (`/`) serves a temporary admin UI placeholder that reads
settings from `/settings`.

## Docs
- AGENTS.md
- HANDOFF.md
- CHECKLIST.md
- CHANGELOG.md

## License
MIT (see LICENSE)
