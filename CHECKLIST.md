# Checklist — Bookdarr Media Server (BMS)

## Repo
- [x] Docs scaffolded
- [ ] Update README/HANDOFF on changes

## Core Features
- [ ] Settings UI: Bookdarr API URL/key
- [ ] Gmail SMTP settings + test email
- [x] Invite code system (persisted)
- [x] Auth (JWT + refresh, persisted)
- [ ] Rate limiting
- [x] Library list from Book Pool (Open Library metadata)
- [ ] Audiobook streaming
- [ ] Ebook downloads

## Security
- [x] Argon2id hashing
- [ ] Login lockout/backoff
- [ ] CORS locked to Reader app

## Diagnostics
- [ ] Required diagnostics (switch to opt‑in at release)
- [x] Push to Bookdarr‑Media‑Diagnostics /bms
