# Changelog — Bookdarr Media Server (BMS)

## 1.0.50 — 2026-01-31 13:22 -06:00
- Keep the EPUB reader UI visible by default on touch devices, improve touch detection, and ensure swipe/tap handling works reliably.

## 1.0.49 — 2026-01-31 09:30 -06:00
- Add EPUB reader UI toggling, dark mode theme support, and layout fixes for touch reading.

## 1.0.48 — 2026-01-31 09:16 -06:00
- Add a touch gesture layer for EPUB reading so swipes/taps always advance pages on iPad.

## 1.0.47 — 2026-01-31 09:10 -06:00
- Hide the Bookdarr connection wizard once a Bookdarr config is detected (including env-only configs).

## 1.0.46 — 2026-01-31 08:58 -06:00
- Fix iPad login flow by initializing reader state before touch handlers to prevent a script crash that blocked auth bootstrap.

## 1.0.45 — 2026-01-31 08:44 -06:00
- Add auth bootstrap fallback to URL hash and redirect back to /login if auth=1 fails to set a session.

## 1.0.44 — 2026-01-31 08:39 -06:00
- Add client-side auth guard to immediately redirect signed-out sessions back to /login.

## 1.0.43 — 2026-01-31 08:34 -06:00
- Clear all stored auth tokens/cookies on the login page so each visit starts clean.

## 1.0.42 — 2026-01-31 08:18 -06:00
- Add a Safari-safe login bootstrap using window.name + auth=1, so iPad sessions work even if cookies are blocked.

## 1.0.41 — 2026-01-31 08:12 -06:00
- Redirect the root route to /login when there is no valid auth bootstrap, so iPad doesn’t land on a signed-out library shell.

## 1.0.40 — 2026-01-31 08:08 -06:00
- Fix ETag disabling for Nest by targeting the underlying HTTP adapter.

## 1.0.39 — 2026-01-31 08:04 -06:00
- Inject server-verified auth bootstrap into the app HTML so iPad loads signed-in state without relying on cached API calls.
- Disable ETag responses and no-store /api/me to avoid Safari 304s that drop user data.

## 1.0.38 — 2026-01-30 21:44 -06:00
- Disable client-side caching for auth/library fetches to prevent 304 responses that leave iPad signed out.

## 1.0.37 — 2026-01-30 20:53 -06:00
- Remove auth UI gating that relied on localStorage so cookie-based sessions on iPad can load users and libraries.
- Attempt refresh on boot even without client-side tokens to let server cookies bootstrap sessions.

## 1.0.36 — 2026-01-30 20:42 -06:00
- Add HTML form-based login/setup flows with server-set cookies to improve iPad sign-in reliability.
- Load current user when only cookie auth is available, even without localStorage tokens.

## 1.0.35 — 2026-01-30 20:28 -06:00
- Set auth cookies server-side and accept JWTs from cookies to improve iPad/Safari sign-in reliability.

## 1.0.34 — 2026-01-30 20:15 -06:00
- Pass auth tokens via URL hash after login to ensure iPad signs in even if storage is blocked.

## 1.0.33 — 2026-01-30 20:09 -06:00
- Persist auth tokens in cookies as a fallback so iPad/Safari stays signed in after login.

## 1.0.32 — 2026-01-30 20:05 -06:00
- Add login cookie + server-side redirects so iPad/Safari consistently lands on the /login page when signed out.

## 1.0.31 — 2026-01-30 19:02 -06:00
- Add a dedicated /login page with standalone markup so signed-out users see only auth fields.

## 1.0.30 — 2026-01-30 15:06 -06:00
- Force redirect to the login page when unauthenticated on any route.

## 1.0.29 — 2026-01-30 15:01 -06:00
- Guard auth storage against iOS/Safari localStorage failures to allow logging in again.

## 1.0.28 — 2026-01-30 14:47 -06:00
- Make touch EPUB reader full-screen with overlay back/progress and iframe swipe detection.

## 1.0.27 — 2026-01-30 14:42 -06:00
- Add touch-only full-screen ebook reader with back button, swipe inside EPUB iframes, and no-scroll layout.

## 1.0.26 — 2026-01-30 12:48 -06:00
- Show EPUB page numbers + percent in the reader header and persist location.
- Add touch-only page-turn animation and move progress text away from the close button.

## 1.0.25 — 2026-01-30 12:39 -06:00
- Raise EPUB navigation arrows above reader content so they remain visible.

## 1.0.24 — 2026-01-30 11:58 -06:00
- Add EPUB navigation arrows, swipe gestures, and enforce single-page pagination.

## 1.0.23 — 2026-01-30 11:53 -06:00
- Match Bookdarr’s EPUB reader flow by loading JSZip and rendering from a blob object URL.

## 1.0.22 — 2026-01-30 11:08 -06:00
- Force EPUB loading as archived files and add a buffered fallback so readers open reliably.

## 1.0.21 — 2026-01-30 10:55 -06:00
- Cache the Book Pool on disk for faster logins and filter out entries with no files.
- Strengthen Bookdarr cover handling via MediaCover API and fix cover fit to avoid cropping.
- Add My Library with per-user checkout/return and move filters to a dropdown.
- Persist sessions with refresh tokens, remove wizard login from the main UI, and improve reader reliability.

## 1.0.20 — 2026-01-30 00:02 -06:00
- Only use Bookdarr cover URLs when they resolve to actual image files; fall back otherwise.

## 1.0.19 — 2026-01-30 23:55 -06:00
- Documented the reader/modal updates in handoff notes.

## 1.0.18 — 2026-01-30 23:50 -06:00
- Load PDF reader assets via module build so the in-app reader renders correctly.
- Add 100-word book description preview with More/Less toggle and scrollable detail modal.

## 1.0.17 — 2026-01-30 23:36 -06:00
- Fix Bookdarr cover URL selection and move cover proxy route to avoid ID routing conflicts.

## 1.0.16 — 2026-01-30 23:33 -06:00
- Synced package-lock after adding local reader libraries.

## 1.0.15 — 2026-01-30 23:32 -06:00
- Bundle EPUB/PDF reader libraries locally to avoid “EPUB reader unavailable” when offline.

## 1.0.14 — 2026-01-30 23:29 -06:00
- Fix Bookdarr cover selection to use image URLs directly so covers render in the Book Pool.

## 1.0.13 — 2026-01-30 23:24 -06:00
- Proxy Bookdarr cover art through BMS and use it as the primary artwork source.
- Pull book overviews from Bookdarr and only fallback to Open Library when missing.
- Added integrated ebook reader (PDF/EPUB) and saved audio/ebook progress in local storage.

## 1.0.12 — 2026-01-30 23:11 -06:00
- Allow Enter key to submit logins on both the setup login panel and the dedicated login page.

## 1.0.11 — 2026-01-30 22:48 -06:00
- Prefer Bookdarr cover art and metadata; only call Open Library when needed.
- Added metadata refresh action per book to re-query Open Library and update the detail view.
- Added Bookdarr image URL resolution for relative cover paths.

## 1.0.10 — 2026-01-30 22:36 -06:00
- Added book detail modal with Open Library metadata, subjects, and description.
- Added Bookdarr-backed file listing with in-browser audiobook playback and ebook open/download actions.
- Added secure Bookdarr file streaming proxy and token-aware streaming support.

## 1.0.9 — 2026-01-30 22:08 -06:00
- Auto-generate and persist JWT secrets on first run.
- Removed auth secret inputs from the setup wizard and settings form.
- Added admin-only “rotate auth secrets” action with status + last rotated timestamp.

## 1.0.8 — 2026-01-30 21:41 -06:00
- Added structured file logging (requests + errors) and diagnostics push logs.
- Registered global exception logging and request logging middleware.
- Removed the “Required (DEV)” label from the diagnostics page.

## 1.0.7 — 2026-01-30 21:37 -06:00
- Ensure an admin user exists (promote oldest user if none).

## 1.0.6 — 2026-01-30 21:36 -06:00
- Added dedicated login page, user menu with logout/profile, and profile editor.
- Ensured first-run wizard hides after Bookdarr is connected and settings are editable in Settings.
- Added Bookdarr settings form in Settings and wired configurable Book Pool path.
- Added /api/me endpoints for profile load/update and stored tokens for logout.

## 1.0.5 — 2026-01-30 21:29 -06:00
- Fixed auth settings controller build by using type-only Request import.

## 1.0.4 — 2026-01-30 21:25 -06:00
- Added admin user management (list/create) and accounts UI.
- Implemented auth secrets settings (wizard + settings page) with persisted storage.
- Added configurable Book Pool API path and Bookdarr config persistence.
- Updated auth to include admin flag and ensured JWT uses stored secrets.
- Removed invite code display from settings and added auth secret status entries.

## 1.0.3 — 2026-01-30 21:06 -06:00
- Fixed auth user typing to build cleanly after username support.

## 1.0.2 — 2026-01-30 21:02 -06:00
- Added clickable navigation with dedicated pages for Downloads, Diagnostics, Settings, and Accounts.
- Moved the Bookdarr connection form into the first-run wizard and clarified steps.
- Switched auth to username-first (email stored for password resets) with UI + API updates.
- Removed the "Open Library matched" label and tightened search behavior to library view.
- Added SSH update requirement after each GitHub push in AGENTS.md.

## 1.0.1 — 2026-01-30 20:47 -06:00
- Documented versioning rules and changelog timestamp requirements in AGENTS.md.
- Added timestamps to all changelog entries for chronological tracking.

## 1.0.0 — 2026-01-29 20:46 -06:00
- Added visible UI version tag (top-left next to BMS) and aligned app version with package.json.

## 0.0.16 — 2026-01-29 20:31 -06:00
- Resolved security alerts (nodemailer update, tar override) and hardened email validation.

## 0.0.15 — 2026-01-29 20:25 -06:00
- Added Bookdarr connection wizard and persistent Bookdarr settings storage.

## 0.0.14 — 2026-01-29 19:56 -06:00
- Added Ubuntu install script with systemd setup.

## 0.0.13 — 2026-01-29 19:35 -06:00
- Added Book Pool library endpoint with Open Library enrichment and a Plex-like UI refresh.

## 0.0.12 — 2026-01-29 19:23 -06:00
- Added first-run setup endpoint and UI wizard for initial user creation.

## 0.0.11 — 2026-01-29 19:18 -06:00
- Added diagnostics auth coverage in e2e tests and documented example flow.

## 0.0.10 — 2026-01-29 19:16 -06:00
- Secured diagnostics endpoint behind JWT auth when configured.

## 0.0.9 — 2026-01-29 19:14 -06:00
- Persisted auth data using SQLite/Postgres via TypeORM.

## 0.0.8 — 2026-01-29 19:06 -06:00
- Added invite-only auth with JWT access/refresh tokens and SMTP password reset.

## 0.0.7 — 2026-01-29 19:00 -06:00
- Added diagnostics endpoint that pushes payloads to GitHub repo.

## 0.0.6 — 2026-01-29 18:56 -06:00
- Added a basic admin UI placeholder at `/` that surfaces redacted settings.

## 0.0.5 — 2026-01-29 18:54 -06:00
- Silenced Node webstorage warning in test scripts.

## 0.0.4 — 2026-01-29 18:43 -06:00
- Added settings module with env parsing and public settings endpoint.

## 0.0.3 — 2026-01-29 18:32 -06:00
- Clarified dev diagnostics requirement and UI/port details.

## 0.0.2 — 2026-01-29 17:22 -06:00
- Updated docs for agent handoff.

## 0.0.1 — 2026-01-29 16:46 -06:00
- NestJS scaffold + initial docs.
