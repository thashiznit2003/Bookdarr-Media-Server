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

## Docs
- AGENTS.md
- HANDOFF.md
- CHECKLIST.md
- CHANGELOG.md

## License
MIT (see LICENSE)
