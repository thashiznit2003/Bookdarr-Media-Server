# Handoff — Bookdarr Media Server

## Status
- Repo created and initialized.
- Documentation scaffold added.

## Decisions
- Tech stack: Node.js + NestJS
- Auth: BMS‑only accounts, invite codes, Gmail SMTP reset
- Bookdarr integration: API key set in BMS admin settings
- Diagnostics: opt‑in by default; later hidden behind secret unlock

## Next Steps
1. Scaffold NestJS app (API + admin UI placeholder).
2. Define config schema for Bookdarr API + SMTP.
3. Create user auth module (JWT + refresh).
4. Add diagnostics opt‑in flag + push pipeline.
5. Draft API contract for Reader app.

## Notes
- BMS should read Book Pool only (not Bookdarr user library).
- BMS should not modify Bookdarr data (read‑only).
