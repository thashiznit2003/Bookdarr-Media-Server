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
- Client-side guard redirects to /login if the UI detects a signed-out session on any app page.
- Auth bootstrap now writes to both window.name and the URL hash, and auth=1 bounces back to /login on failure.
- Touch-device reader initialization must declare its observer before use to avoid a script crash that blocks iPad auth boot.
- Bookdarr connection wizard hides automatically when Bookdarr is configured (DB or env settings).
- EPUB reader uses a touch gesture overlay for reliable swipe/tap navigation on iPad.
- Reader supports a tap-to-toggle UI on touch devices plus light/dark EPUB themes and layout sizing fixes.
- Touch reader UI now shows by default on iPad and uses more robust touch detection.
- EPUB reader now prefers displayed page numbers and enforces single-page spreads with improved gesture handling.
- EPUB reader now mirrors Bookdarr’s render defaults and re-applies themes per section for reliable pagination/visibility.
- EPUB reader page numbers now use location-based counts for stable sequential paging.
- EPUB reader now uses per-chapter displayed page totals for sequential page numbers and improved overlay gestures.
- EPUB swipe gestures are enabled while keeping overlay buttons interactive.
- EPUB page numbers now resolve section indices from the spine to avoid random resets.
- EPUB page offsets are now persisted per file + viewport so page numbers stay stable after reopening.
- EPUB page numbering now enforces monotonic increases to avoid backward jumps.
- EPUB page numbering now rebases on the first visible page and uses nav direction to avoid early jumps.
- EPUB page numbers now follow explicit page-turn actions to prevent fast-swipe drift.
- Book cover URLs must point to image files (jpg/png/webp/gif); otherwise fall back to Open Library.
- Book Pool filters are a dropdown; cover images use `object-fit: contain` to avoid cropping.
- My Library supports per-user checkout/return; sessions refresh automatically via refresh tokens.
- Checkout now queues server-side offline downloads per user (cached under `data/offline`) and My Library cards show an App Store-style progress ring until ready.
- Returning a book removes cached files and marks the book as read for that user; read status can be toggled per book.
- Downloads are surfaced only inside My Library; `/downloads` redirects to `/my-library`.
- Desktop EPUB reader now falls back to a direct stream URL if blob loading fails.
- Offline download error fields are stored as sqlite-compatible text.
- Desktop reader overlay UI is touch-only; epub iframes are forced to full height with a resize nudge for macOS.
- Desktop EPUB rendering now retries display if the iframe renders blank.
- Desktop reader layout now recalculates height on open/resize to prevent zero-height EPUB iframes.
- Desktop reader height calculations avoid template literals so the build succeeds.
- Reader control bar now sits above iframe content so desktop buttons remain clickable.
