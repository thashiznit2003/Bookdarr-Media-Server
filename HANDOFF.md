# Handoff — Bookdarr Media Server

## Status
- Repo created and initialized.
- NestJS scaffold generated.
- Docs refreshed to project intent.

## Decisions
- Tech stack: Node.js + NestJS
- Auth: BMS‑only accounts, invite codes, Gmail SMTP reset
- Bookdarr integration: API key set in BMS admin settings
- Diagnostics: opt‑in by default; later hidden behind secret unlock

## Next Steps
1. Implement config module (Bookdarr API + SMTP).
2. Build auth module (JWT + refresh + invite codes).
3. Add rate limiting + password policy.
4. Add Bookdarr client (read‑only Book Pool).
5. Add diagnostics opt‑in + GitHub push.

## Notes
- BMS should read Book Pool only (not Bookdarr user library).
- BMS should not modify Bookdarr data (read‑only).
