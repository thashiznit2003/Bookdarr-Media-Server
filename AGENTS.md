# AGENTS.md — Bookdarr Media Server (BMS)

## Project Summary
BMS is a secure, public‑facing media server that reads from Bookdarr’s **Book Pool** and serves audiobooks/ebooks to the Bookdarr Media Reader app. Bookdarr itself should remain private. BMS has its **own user accounts** and never exposes the Bookdarr API key to clients.

## Tech Stack
- Node.js + NestJS
- SQLite (dev), PostgreSQL (prod)
- Optional Redis (rate limiting / cache)

## Security Requirements
- JWT auth + refresh tokens
- Invite‑code signup only
- Gmail SMTP password reset (app password)
- Rate limiting on auth endpoints
- Strong password hashing (Argon2id preferred)

## Constraints
- Read‑only access to Bookdarr data
- Progress stored on device (Reader), not server
- Diagnostics required during development; later hidden behind secret unlock

## Required Docs
- README.md
- CHANGELOG.md
- HANDOFF.md
- CHECKLIST.md
- AGENTS.md

## Diagnostics
- Push opt‑in diagnostics to Bookdarr‑Media‑Diagnostics under `/bms/`

## Dev Environment
- Ubuntu during development
- Docker later for production

## Handoff Discipline
Update `HANDOFF.md` and `CHANGELOG.md` after each meaningful change.
Track app version in `package.json` and surface it in the UI (top-left next to BMS).
Each GitHub push increments the patch version (x.x.n+1) and adds a changelog entry with date + time (newest first).
After each GitHub push, update the Ubuntu VM via SSH so the UI reflects the latest build.

## UI Notes
- Book detail modal shows a 100-word description preview with a More/Less toggle; modal content can scroll.
- PDF reader loads module assets from `/vendor/pdfjs/pdf.mjs` with worker `/vendor/pdfjs/pdf.worker.mjs`.
- EPUB reader shows page numbers + percent in the header, persists location, and animates touch page turns.
- Book cover URLs must point to image files (jpg/png/webp/gif); otherwise fall back to Open Library.
- Book Pool filters are a dropdown; cover images use `object-fit: contain` to avoid cropping.
- My Library supports per-user checkout/return; sessions refresh automatically via refresh tokens.
