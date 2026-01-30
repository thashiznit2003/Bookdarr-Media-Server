# Handoff — Bookdarr Media Server (BMS)

## Current Status
- Repo initialized with NestJS scaffold.
- Docs updated for new agent handoff.
- Settings module added (env parsing + redacted `/settings` endpoint).
- Test scripts disable experimental webstorage to avoid Node warnings.
- Basic admin UI placeholder added at `/` (HTML + fetches `/settings`).
- Diagnostics endpoint added (`POST /diagnostics`) that pushes payloads to the diagnostics repo.
- Auth module added with invite-only signup, JWT access/refresh, and password reset via SMTP (SQLite/Postgres storage via TypeORM).
- Diagnostics endpoint now requires auth when JWT secrets are configured.
- e2e tests cover auth-required diagnostics and README now includes login + diagnostics curl flow.
- First-run setup wizard added for initial user creation (GET/POST `/auth/setup`).
- Book Pool library endpoint added (`GET /library`) with Open Library enrichment and Plex-inspired UI.
- Added Ubuntu install script at `scripts/install-bms.sh` (systemd + env file).
- Bookdarr connection wizard added after login (stores Bookdarr IP/port/API key in DB).

## Decisions
- Stack: Node.js + NestJS
- Accounts: BMS‑only accounts, invite codes
- SMTP: Gmail via app password
- Bookdarr integration: API key stored in BMS settings UI (server‑side only)
- UI: web app on port 9797
- Target OS: Ubuntu until Docker
- Diagnostics: required during development; opt‑in later behind secret unlock

## Immediate Next Steps
1. Persist auth storage (DB), add rate limiting and account management.
2. Admin UI placeholder (simple web UI or API endpoints for settings).
3. Bookdarr client module (read‑only Book Pool endpoints).
4. Lock down diagnostics endpoint once auth exists.

## Notes
- BMS must never expose Bookdarr API key.
- BMS should not modify Bookdarr data (read‑only).
