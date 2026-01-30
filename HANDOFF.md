# Handoff — Bookdarr Media Server (BMS)

## Current Status
- Repo initialized with NestJS scaffold.
- Docs updated for new agent handoff.
- Settings module added (env parsing + redacted `/settings` endpoint).
- Test scripts disable experimental webstorage to avoid Node warnings.
- Basic admin UI placeholder added at `/` (HTML + fetches `/settings`).
- Diagnostics endpoint added (`POST /diagnostics`) that pushes payloads to the diagnostics repo.
- Auth module added with invite-only signup, JWT access/refresh, and password reset via SMTP (in-memory storage).

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
