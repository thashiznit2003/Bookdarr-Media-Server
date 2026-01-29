# AGENTS.md — Bookdarr Media Server

## Project Intent
BMS is a secure, public‑facing media server that reads from Bookdarr (Book Pool only) and serves the Bookdarr Media Reader app.

## Constraints
- Do not expose Bookdarr directly to the public web.
- BMS uses its own user accounts with invite codes.
- BMS stores Bookdarr API key in admin settings (never client‑side).
- Diagnostics opt‑in by default; later hidden behind a secret unlock.

## Required Files
- README.md
- CHANGELOG.md
- HANDOFF.md
- CHECKLIST.md
- AGENTS.md

## Dev Environment
- Ubuntu during development
- Docker target later (CI/CD already set up in GitHub)

## Security Requirements
- JWT auth + refresh tokens
- Rate limiting on auth endpoints
- Strong password hashing (Argon2id preferred)
- Email reset flow (Gmail SMTP)

## Diagnostics
- Send opt‑in diagnostics to Bookdarr‑Media‑Diagnostics repo under `/bms/`

## Handoff Notes
Maintain `HANDOFF.md` after each change.
