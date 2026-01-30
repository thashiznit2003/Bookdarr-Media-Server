# Handoff — Bookdarr Media Server (BMS)

## Current Status
- Repo initialized with NestJS scaffold.
- Docs updated for new agent handoff.
- No app features implemented yet.

## Decisions
- Stack: Node.js + NestJS
- Accounts: BMS‑only accounts, invite codes
- SMTP: Gmail via app password
- Bookdarr integration: API key stored in BMS settings UI (server‑side only)
- UI: web app on port 9797
- Target OS: Ubuntu until Docker
- Diagnostics: required during development; opt‑in later behind secret unlock

## Immediate Next Steps
1. Create config/settings module (Bookdarr API URL/key, Gmail SMTP, diagnostics opt‑in).
2. Auth module: invite code signup, JWT + refresh, password reset email.
3. Admin UI placeholder (simple web UI or API endpoints for settings).
4. Bookdarr client module (read‑only Book Pool endpoints).
5. Diagnostics push: GitHub repo `/bms/` folder.

## Notes
- BMS must never expose Bookdarr API key.
- BMS should not modify Bookdarr data (read‑only).
