# AGENTS.md — Bookdarr Media Server (BMS)

## Project Summary
BMS is a secure, public‑facing media server that reads from Bookdarr’s **Book Pool** and serves audiobooks/ebooks to the Bookdarr Media Reader app. Bookdarr itself should remain private. BMS has its **own user accounts** and never exposes the Bookdarr API key to clients.

## Tech Stack
- Node.js + NestJS
- SQLite (dev), PostgreSQL (prod)
- Optional Redis (rate limiting / cache)

## Mobile API Contract
- The mobile app must use versioned endpoints under `/api/v1/*`. Do not introduce breaking changes to `/api/v1/*`; bump API version (`/api/v2`) instead.

## Security Requirements
- JWT auth + refresh tokens
- Invite-code signup only
- Gmail SMTP password reset (app password)
- Rate limiting on auth endpoints
- Strong password hashing (Argon2id preferred)
- Request correlation: the server sets `x-request-id` on every response and includes `requestId` in request/exception logs.
- 2FA secrets are encrypted at rest using the auth access secret.
  - TOTP is implemented internally in `src/auth/totp.ts` (RFC 6238) so Jest e2e can execute 2FA flows without ESM-only OTP dependencies. Do not re-introduce `otplib` without re-validating Jest/CI.
  - Access tokens include a per-user `tokenVersion` (`tv`) and the JWT strategy checks it against the DB, so password/2FA changes can immediately invalidate existing sessions.
  - Refresh tokens are multi-device: each device/browser session has a stable `sid` stored in `auth_sessions`, and refresh token `jti` rotates on every refresh (one-time use). Logout revokes the `sid`, and the JWT strategy rejects access tokens for revoked/missing sessions.
  - Access/refresh cookies are `HttpOnly` and set `Secure` automatically when behind HTTPS (x-forwarded-proto).

## Constraints
- Read‑only access to Bookdarr data
- Reader progress stored server-side with local cache; Sync/Restart controls update the server
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
Use the configured SSH host + key:
- `ssh bms-vm "git -C /opt/bookdarr-media-server pull --ff-only; npm --prefix /opt/bookdarr-media-server ci; npm --prefix /opt/bookdarr-media-server run build; sudo systemctl restart bookdarr-media-server"`
If SSH updates show npm deprecation warnings, fix them in the dependency graph (preferred) rather than silencing logs. The EPUB reader is vendored (see note below), so `npm ci` should stay clean.
2FA reset command (for Docker/env usage):
- `RESET_2FA_ALL=true npm run reset-2fa` or `RESET_2FA_USER=user1,user2 npm run reset-2fa`

## DB Migrations / Backups
- Production-like mode: set `DB_SYNC=false` and `DB_MIGRATIONS=true` (migrations run automatically at startup).
- SQLite DB path must be writable by the systemd user (`bms`) or you will hit `SQLITE_READONLY` on login/config writes.
- Backup/restore commands are documented in `HANDOFF.md`.

## UI Notes
- Book detail modal shows a 100-word description preview with a More/Less toggle; modal content can scroll.
- Book descriptions can contain upstream HTML from Bookdarr/OpenLibrary; normalize to safe plain text server-side (strip tags, decode entities). Do not render upstream HTML directly.
- IMPORTANT: `src/app.service.ts` embeds client JS inside a server-side template literal. Any regex escapes like `\s` must be written as `\\s` or the browser will receive `/s/` (the letter) instead of `/\s/` (whitespace), which can corrupt user-visible text (e.g., missing lowercase `s` in descriptions).
- PDF reader loads module assets from `/vendor/pdfjs/pdf.mjs` with worker `/vendor/pdfjs/pdf.worker.mjs`.
- EPUB reader uses full-screen touch mode with overlay back/progress and iframe swipe handling; auth storage is guarded for iOS/Safari, and unauthenticated users are redirected to a dedicated /login page with no UI chrome.
- Auth sessions set a lightweight `bmsLoggedIn` cookie so the server can redirect signed-out devices (including iPad/Safari) to `/login` before the app shell loads.
- Web auth is cookie-only: access/refresh tokens live in `HttpOnly` cookies, and the SPA never stores JWTs or sends `Authorization` headers for same-origin requests (prevents stale-token 401 -> refresh spam loops).
- `bmsLoggedIn` is a non-sensitive hint only (used for redirects); it must not be treated as authentication.
- Do not re-introduce token-in-URL bootstrap flows (`/?auth=1`, `#access=...`); they caused stale-token refresh loops and rate limiting.
- Dedicated `/login` uses form POSTs to set cookies via top-level navigation (more reliable on iPad/Safari).
- Auth and library fetches use `cache: no-store` to avoid 304 responses that can leave iPad showing Signed Out.
- Server injects a verified auth bootstrap (user only) into the HTML so iPad doesn’t depend on cached /api/me.
- Root route redirects to /login when no bootstrap user is present to avoid signed-out shells.
- Login page now clears stored auth tokens/cookies on load to force a fresh sign-in each time.
- Client-side guard redirects to /login if the UI detects a signed-out session on any app page.
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
- EPUB.js pagination is sensitive: do not force `overflow: hidden` on the EPUB iframe `html/body` and do not clamp/override CSS columns (`column-count`, `column-width`, `max-width`) inside the rendered document. Those overrides caused intra-chapter pages to be skipped (chapters looked like ~2 pages). Keep custom reader CSS limited to the outer container and let epub.js manage internal pagination.
- EPUB reader JS is vendored under `vendor/epub/epub.min.js` and served from `/vendor/epub/`. Do not re-introduce the `epubjs` npm dependency without re-verifying archived `.epub` support and `npm audit` cleanliness.
- JSZip is also vendored under `vendor/jszip/jszip.min.js` and served from `/vendor/jszip/` (required by epub.js).
- Do not append access tokens into media/image URLs when cookie auth is available; otherwise the URL token can go stale after refresh and can leak into logs/history.
- Reader progress is stored in DB via /reader/progress; Sync reconciles latest progress and Restart clears it.
- Readium is not used in the BMS web UI/server (removed due to dependency security issues). Web reading uses epub.js; the future mobile apps should use Readium native SDKs.
- Legacy epub.js reader is hidden unless enabled in Settings → Reader Compatibility.
- Book cover URLs must point to image files (jpg/png/webp/gif); otherwise fall back to Open Library.
- Book Pool filters are a dropdown; cover images use `object-fit: contain` to avoid cropping.
- My Library supports per-user checkout/return; sessions refresh automatically via refresh tokens.
- Checkout now queues server-side offline downloads per user (cached under `data/offline`) and My Library cards show an App Store-style progress ring until ready (this ring reflects VM caching only).
- BMS exposes two distinct “download” concepts in the UI:
  - `Server cache: ...` is VM-side caching (BMS downloads files under `data/offline`) to make streaming fast and resilient.
  - `Offline on this device: ...` is per-browser/device caching (Service Worker Cache Storage) so the same browser can read/listen fully offline.
- Device-side caching requires HTTPS (secure context); it will not work on plain LAN `http://<ip>:9797` (except `localhost`).
- Device-side offline status is reported per media type (Ebook vs Audiobook). A device offline failure does not imply streaming is broken; it only means this browser does not currently have an offline copy.
- Offline audio needs HTTP Range support for seeking; the SW caches large audiobook streams in fixed-size chunks and serves `206` responses from cache.
- Streaming MIME types: prefer the named stream routes (`/library/files/:id/stream/:name` and `/api/v1/library/files/:id/stream/:name`). The server uses the `:name` hint to correct upstream octet-stream responses (ex: `.m4b` -> `audio/mp4`).
- If device offline caching fails with `Device offline: Failed`, suspect expired auth during a long download; SW auto-refreshes on 401 and retries once.
- SW `OFFLINE_STATUS` messages can be per-file (includes `fileId`) or per-book (final). The UI must not mark a book as failed on a per-file failure; this produces false "Failed" even when other files complete. Book-level failure is only when *all* files fail; otherwise show `Partial` and offer retry.
- Service Worker commands are fire-and-forget (no response message exists for `CACHE_BOOK`/`CLEAR_BOOK`). Do not `await` a reply for those commands; only `QUERY_BOOKS` returns `QUERY_BOOKS_RESULT`.
- SW must normalize device offline URLs to absolute URLs before caching. Relative URLs break chunked audiobook caching (`new URL(...)`) and can prevent cache hits when fetch requests are absolute.
- In `public/sw.js`, `cache.put()` consumes the response body. If you also need to read the body (for progress), clone the response before `cache.put()` and consume the original stream separately.
- SW offline caching is sequential per book (one active book at a time). Other books will show `Offline on this device: Queued (#N in line)` while waiting.
- SW must resume pending offline downloads after restarts/updates by scanning IndexedDB for queued/downloading records and re-enqueueing them (otherwise UI can sit at `Queued` forever).
- To free VM disk space, use Settings -> Storage -> `Clear Server Cache` (admin-only). This deletes VM-cached offline media under `data/offline` and clears `offline_downloads` DB rows.
- Audiobook chunk caching uses bounded parallel fetch (chunk concurrency) for higher throughput on LAN without saturating mobile devices.
- CI: GitHub Actions runs `npm ci`, `npm test`, `npm run test:e2e`, `npm run build`, and `npm audit --omit=dev` on pushes/PRs.
- Jest e2e runs with `maxWorkers: 1` (`test/jest-e2e.json`) because e2e tests set process env globals; parallel workers can collide.
- Returning a book removes cached files and marks the book as read for that user; read status can be toggled per book.
- Downloads are surfaced only inside My Library; `/downloads` redirects to `/my-library`.
- Desktop EPUB reader now falls back to a direct stream URL if blob loading fails.
- Offline download error fields are stored as sqlite-compatible text.
- Desktop reader overlay UI is touch-only; epub iframes are forced to full height with a resize nudge for macOS.
- Desktop EPUB rendering now retries display if the iframe renders blank.
- Desktop reader layout now recalculates height on open/resize to prevent zero-height EPUB iframes.
- Desktop reader height calculations avoid template literals so the build succeeds.
- Reader control bar now sits above iframe content so desktop buttons remain clickable.
- Touch swipe page turns no longer animate to prevent flicker.
- My Library download progress overlays update in-place to avoid cover flicker.
- Settings now focus on editable panels (Bookdarr + SMTP); diagnostics UI and auth secret controls are hidden.
- SMTP config is stored in DB via /settings/smtp and used for password reset emails.
- SMTP settings controller uses a type-only import to satisfy isolatedModules builds.
- Create User panel is visible only to admins.
- `/accounts` is admin-only. Non-admin users receive a 403 "Not authorized" page and remain signed in.
- Auth module now exports AdminGuard so settings controllers can use it without DI errors.
- Settings module now includes UserEntity repository to satisfy AdminGuard dependencies.
- Any module that uses AdminGuard (ex: Library) must also register `UserEntity` in `TypeOrmModule.forFeature([...])` or Nest can crash at startup with `UnknownDependenciesException` and the reverse proxy will return 502.
- Settings no longer show Book Pool Path, and Bookdarr connections can be tested from the UI via /settings/bookdarr/test.
- SMTP settings can be tested via /settings/smtp/test, and the Bookdarr title dot reflects live connectivity.
- SMTP settings now show a title status dot based on live connectivity checks.
- SMTP now supports a From Name value that is combined with the From address when sending mail.
- Settings types now include SMTP From Name in public/private config output.
- SMTP test fallback now carries From Name when using stored config.
- SMTP settings fields now use a form grid to align inputs.
- SMTP field labels are forced above inputs to match a two-row layout.
- SMTP settings now use the same stacked label layout as Bookdarr, and Bookdarr HTTPS disables the port field.
- Bookdarr HTTPS toggle now sits directly under the Protocol label.
- SMTP status dot now uses a verify-only check so test emails send only when requested.
- Bookdarr HTTPS checkbox is now aligned directly with its label.
- Bookdarr HTTPS label is forced to stay on one line next to the checkbox.
- Bookdarr HTTPS label now sits to the left of the checkbox.
- Bookdarr HTTPS protocol toggle now anchors the checkbox right while keeping the label to its left.
- Library UI now includes a manual Refresh button that clears and rebuilds the Book Pool cache.
- Bookdarr connection tests now reject non-local hosts to prevent SSRF.
- Bookdarr HTTPS field now uses a "Use HTTPS" label with the checkbox directly below.
- Bookdarr HTTPS checkbox is now left-aligned under its label.
- Form-grid input sizing now excludes checkboxes so the HTTPS toggle aligns correctly.
- Added welcome email on user creation, password reset flow in login UI, and TOTP-based 2FA setup with QR codes.
- 2FA now uses otplib/authenticator import to fix build.
- 2FA now uses otplib namespace import to fix module resolution.
- 2FA now uses otplib functional helpers (generateSecret/generateURI/verify) for stability.
- Login now exposes twoFactorRequired and reveals OTP input on 401 for 2FA users.
