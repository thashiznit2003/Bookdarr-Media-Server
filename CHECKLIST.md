# Checklist — Bookdarr Media Server

## Repo
- [ ] README.md updated
- [ ] CHANGELOG.md updated
- [ ] HANDOFF.md updated
- [ ] CHECKLIST.md updated

## Core Features
- [ ] Bookdarr API key settings
- [ ] Gmail SMTP config + test email
- [ ] Invite code system
- [ ] JWT auth + refresh
- [ ] Rate limiting
- [ ] Library listing (Book Pool)
- [ ] Audiobook streaming (range requests)
- [ ] Ebook download

## Security
- [ ] Strong password hashing (Argon2id)
- [ ] Lockout/backoff on failed login
- [ ] CORS locked to UI origins

## Diagnostics
- [ ] Opt‑in diagnostics
- [ ] Push to Bookdarr‑Media‑Diagnostics under /bms

## Deployment
- [ ] Ubuntu dev runbook
- [ ] Docker plan (later)
