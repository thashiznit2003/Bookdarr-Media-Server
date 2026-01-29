# Bookdarr Media Server (BMS)

Bookdarr Media Server (BMS) is a secure, public‑facing media server that reads from Bookdarr's Book Pool and serves audiobooks/ebooks to the Bookdarr Media Reader mobile app. BMS is designed to be internet‑exposed; Bookdarr itself should remain private.

## Goals
- Secure, public API + streaming (similar to Plex/Jellyfin)
- Separate BMS user accounts (invite‑code signup)
- Offline downloads via the Reader app
- Progress stored **on device** (Reader), not server
- Integrate with Bookdarr via API key
- Gmail SMTP support for password reset

## Tech Stack
- Node.js + NestJS
- PostgreSQL (or SQLite for dev)
- Redis (optional for rate limiting/session cache)

## Development Environment
- Target dev OS: Ubuntu
- Production target: Docker (later)

## Configuration (planned)
- Bookdarr API URL + API Key (admin settings UI)
- SMTP (Gmail) settings: host, port, username, app password
- Invite code management
- Diagnostics opt‑in (disabled by default)

## Security Notes
- Never expose Bookdarr directly to the public internet.
- BMS enforces authentication, rate limiting, and strong password policies.

## Docs
- `AGENTS.md` — collaboration rules and agent handoff
- `HANDOFF.md` — current state + next steps
- `CHECKLIST.md` — build/run/deploy checklist
- `CHANGELOG.md` — chronological changes

## License
Open‑source, no ads, no payments. License details will be finalized in `LICENSE`.
