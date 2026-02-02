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
- Login now reveals the OTP field when 2FA is required and preserves it via login redirects.
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
- Added a client-side auth guard that redirects signed-out sessions back to /login immediately.
- Auth bootstrap now writes tokens into both window.name and the URL hash, with a fallback redirect if auth=1 fails.
- Checkout now queues server-side offline downloads per user, cached under `data/offline` with progress status exposed to the UI.
- Cached downloads are served back through `/library/files/:id/stream` when ready, and returning a book marks it as read with a resettable toggle.
- Removed the dedicated Downloads page; /downloads now redirects to My Library.
- Desktop EPUB reader now falls back to the direct stream URL if blob loading fails.
- Offline download errors are stored as text so sqlite can start cleanly.
- Desktop EPUB rendering now forces full-height iframes and keeps overlay controls touch-only.
- Desktop EPUB rendering now retries display if the iframe stays blank on first load.
- Reader layout height is recalculated on open/resize so desktop EPUB content can render.
- Desktop reader height calculations now avoid template literals to keep the build green.
- Reader control bar now sits above iframe content so desktop buttons remain clickable.
- Touch swipe page turns no longer animate to prevent flicker.
- My Library download progress overlays update in-place to avoid cover flicker.
- Settings now show editable Bookdarr + SMTP panels only; diagnostics UI and auth secret controls are hidden.
- SMTP settings are stored in DB and used by the mailer service for password reset emails.
- Create User panel is hidden unless the user is an admin.
- SMTP settings controller uses a type-only import to satisfy isolatedModules builds.
- Auth module now exports AdminGuard so settings controllers can use it without DI errors.
- Settings module now includes UserEntity repository to satisfy AdminGuard dependencies.
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
- 2FA verification now uses the otplib boolean result so existing codes validate.
- 2FA login now uses a short-lived challenge token and a dedicated OTP step (no retyping username/password).
- Login page now surfaces errors in red beneath the Log in button.
- Dependency overrides now upgrade node-gyp, test-exclude, and xmldom to avoid deprecated transitive packages.

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
- VM deploy uses the SSH host alias and key: `ssh bms-vm "git -C /opt/bookdarr-media-server pull --ff-only; npm --prefix /opt/bookdarr-media-server ci; npm --prefix /opt/bookdarr-media-server run build; sudo systemctl restart bookdarr-media-server"`
