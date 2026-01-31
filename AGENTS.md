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
- EPUB reader uses full-screen touch mode with overlay back/progress and iframe swipe handling; auth storage is guarded for iOS/Safari, and unauthenticated users are redirected to a dedicated /login page with no UI chrome.
- Auth sessions set a lightweight `bmsLoggedIn` cookie so the server can redirect signed-out devices (including iPad/Safari) to `/login` before the app shell loads.
- Access/refresh tokens are mirrored to cookies as a fallback when Safari blocks localStorage, so signed-in state persists on iPad.
- After login, access/refresh tokens are also passed via URL hash so Safari can bootstrap auth even if storage is blocked.
- Auth endpoints now set cookies server-side and JWT guards accept tokens from cookies to keep iPad/Safari signed in.
- Dedicated /login now uses form POSTs to set cookies via top-level navigation (more reliable on iPad).
- App boot no longer requires localStorage tokens before loading the user/library; cookie auth is sufficient.
- Auth and library fetches use `cache: no-store` to avoid 304 responses that can leave iPad showing Signed Out.
- Server injects a verified auth bootstrap (token + user) into the HTML so iPad doesn’t depend on cached /api/me.
- Root route redirects to /login when no bootstrap user is present to avoid signed-out shells.
- Login now bootstraps via `window.name` + `?auth=1` to handle iPad/Safari cookie blocking.
- Login page now clears stored auth tokens/cookies on load to force a fresh sign-in each time.
- Book cover URLs must point to image files (jpg/png/webp/gif); otherwise fall back to Open Library.
- Book Pool filters are a dropdown; cover images use `object-fit: contain` to avoid cropping.
- My Library supports per-user checkout/return; sessions refresh automatically via refresh tokens.
