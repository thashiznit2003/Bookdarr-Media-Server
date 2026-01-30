# Handoff — Bookdarr Media Server (BMS)

## Current Status
- Repo initialized with NestJS scaffold.
- Docs updated for new agent handoff.
- Settings module added (env parsing + redacted `/settings` endpoint).

## Decisions
- Stack: Node.js + NestJS
- Accounts: BMS‑only accounts, invite codes
- SMTP: Gmail via app password
- Bookdarr integration: API key stored in BMS settings UI (server‑side only)
- UI: web app on port 9797
- Target OS: Ubuntu until Docker
- Diagnostics: required during development; opt‑in later behind secret unlock

## Immediate Next Steps
1. Auth module: invite code signup, JWT + refresh, password reset email.
2. Admin UI placeholder (simple web UI or API endpoints for settings).
3. Bookdarr client module (read‑only Book Pool endpoints).
4. Diagnostics push: GitHub repo `/bms/` folder.

## Notes
- BMS must never expose Bookdarr API key.
- BMS should not modify Bookdarr data (read‑only).
