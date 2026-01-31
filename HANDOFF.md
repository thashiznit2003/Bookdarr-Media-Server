# Handoff — Bookdarr Media Server (BMS)

## Current Status
- Repo initialized with NestJS scaffold.
- Docs updated for new agent handoff.
- Settings module added (env parsing + redacted `/settings` endpoint).
- Test scripts disable experimental webstorage to avoid Node warnings.
- Basic admin UI placeholder added at `/` (HTML + fetches `/settings`).
- Diagnostics endpoint added (`POST /diagnostics`) that pushes payloads to the diagnostics repo.
- Auth module added with invite-only signup, JWT access/refresh, and password reset via SMTP (SQLite/Postgres storage via TypeORM).
- Diagnostics endpoint now requires auth when JWT secrets are configured.
- e2e tests cover auth-required diagnostics and README now includes login + diagnostics curl flow.
- First-run setup wizard added for initial user creation (GET/POST `/auth/setup`).
- Book Pool library endpoint added (`GET /library`) with Open Library enrichment and Plex-inspired UI.
- Added Ubuntu install script at `scripts/install-bms.sh` (systemd + env file).
- Bookdarr connection wizard added after login (stores Bookdarr IP/port/API key in DB).
- Added auth secrets storage + UI settings, username-based login, and admin accounts tooling.
- Added login page, profile editor, and configurable Book Pool path in settings.
- Added file-based request/error logging and diagnostics push logging.
- Auto-generate JWT secrets on first run and provide admin-only rotation (no UI secret inputs).
- Added book detail view with Open Library metadata, Bookdarr file listings, and in-browser playback/reading via proxy streams.
- Prefer Bookdarr cover/overview data with Open Library as a fallback; added per-book refresh metadata action.
- Login now submits on Enter key in both login flows.
- Cover art now proxies through BMS, Bookdarr overviews are preferred, and reader progress is persisted locally.
- Fixed Bookdarr cover selection to use the correct image URL.
- Reader libraries now served locally from node_modules to avoid CDN dependency.
- Package-lock synced after adding reader dependencies.
- Cover proxy now uses /library/cover-image and prefers actual Bookdarr image URLs.
- Versioning: UI shows `vX.Y.Z` next to BMS using package.json version; bump patch for each GitHub push/app update.
- Book detail modal now truncates descriptions to 100 words with a More/Less toggle and supports scrolling.
- PDF reader assets now load from the module build so the in-app reader renders correctly.
- Book cover selection now prefers Bookdarr URLs that resolve to actual image files and falls back otherwise.
- Added on-disk Book Pool cache, Bookdarr MediaCover fallback, and filtering of books without files.
- Added My Library with per-user checkout/return plus refresh-token session persistence and dropdown filters.
- EPUB reader now forces archived loading and falls back to buffered fetch if streaming mode fails.
- EPUB reader now loads JSZip and renders from a blob object URL to mirror Bookdarr behavior.
- EPUB reader now paginates single-page views with arrows + swipe navigation.
- EPUB reader arrows now render above reader content (overlay z-index fix).
- EPUB reader now shows page numbers + percent in the header and persists location with touch-only page-turn animation.
- Touch devices now use a full-screen EPUB reader with back button, no scroll, and iframe swipe handling.
- Touch reader now hides toolbars and shows overlay back/progress controls for a cleaner full-screen view.
- Auth storage now guards localStorage access for iOS/Safari so login doesn’t break.
- Unauthenticated users now redirect to `/login` on any route, preventing blank library states.
- `/login` is now a dedicated page with standalone markup (no menus/sidebars when signed out).
- Auth now sets a lightweight cookie (`bmsLoggedIn`) so server-side redirects can route iPad/Safari users to `/login` consistently.
- Access/refresh tokens are now mirrored to cookies as a fallback when localStorage fails on iPad/Safari.
- Login now passes tokens via URL hash so iPad/Safari can bootstrap auth even if cookies/storage are blocked.
- Auth controllers now set cookies on login/refresh/setup and JWT strategy reads access tokens from cookies for iPad reliability.
- Login/setup pages now submit via HTML forms to /auth/login/web and /auth/setup/web for Safari-safe cookie setting.
- Client boot now attempts cookie-based refresh even with no localStorage, and UI no longer blocks on missing client tokens.
- Client fetches now disable caching to avoid 304 responses without bodies (fixes Signed Out on iPad).
- Server now injects verified auth/user bootstrap into the HTML and disables ETags to keep iPad signed in.
- Root route now redirects to /login unless a valid bootstrap user is present.
- Added a window.name-based auth bootstrap for Safari/iPad when cookies are blocked.
- Login page now clears stored auth tokens/cookies on load for a fresh session every visit.

## Decisions
- Stack: Node.js + NestJS
- Accounts: BMS‑only accounts, invite codes
- SMTP: Gmail via app password
- Bookdarr integration: API key stored in BMS settings UI (server‑side only)
- UI: web app on port 9797
- Target OS: Ubuntu until Docker
- Diagnostics: required during development; opt‑in later behind secret unlock

## Immediate Next Steps
1. Persist auth storage (DB), add rate limiting and account management.
2. Admin UI placeholder (simple web UI or API endpoints for settings).
3. Bookdarr client module (read‑only Book Pool endpoints).
4. Lock down diagnostics endpoint once auth exists.

## Notes
- BMS must never expose Bookdarr API key.
- BMS should not modify Bookdarr data (read‑only).
- Version bump rule: one GitHub push = increment patch (x.x.n+1) in `package.json` and `CHANGELOG.md`.
