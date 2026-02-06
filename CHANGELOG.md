# Changelog — Bookdarr Media Server (BMS)

## 1.0.221 — 2026-02-06 15:14 -06:00
- Fix book descriptions showing raw HTML tags and missing letters by normalizing Bookdarr/OpenLibrary description HTML to safe plain text (tags stripped, entities decoded, whitespace normalized).
- Preserve line breaks in the description UI (rendered as `pre-line`).

## 1.0.220 — 2026-02-06 01:59 -06:00
- My Library progress ring now reflects server-side downloads only (avoids confusing device/PWA status with VM caching).
- Device-side caching is now manual (via the book detail "Download offline" toggle) instead of auto-starting on checkout; prevents misleading device failure messages when server caching succeeds.
- Rename UI label from "Device offline" to "Device copy" to clarify it's per-device PWA caching.

## 1.0.219 — 2026-02-06 01:37 -06:00
- Fix false `Device offline: Failed` reports: per-file failures no longer mark the entire book as failed; the UI shows `Partial` and re-queries the SW for the final state.
- Improve device offline audiobook throughput by downloading cached audio chunks in parallel (bounded concurrency).
- Expose device offline `fileCount/readyCount/failedCount` so partial vs failed states are represented accurately in the UI.

## 1.0.218 — 2026-02-06 01:17 -06:00
- My Library download progress ring now appears immediately on checkout (optimistic queued state + short minimum visibility so fast downloads still show feedback).
- Reduce false `Device offline: Failed` reports by reconciling device status via SW queries and by treating SW DB status as the source of truth (no more "chunk 0 exists = ready").

## 1.0.217 — 2026-02-06 01:05 -06:00
- Fix device offline audiobook failures caused by expiring auth during long downloads: Service Worker now auto-refreshes and retries once on `401` while caching.
- Increase offline audiobook chunk size (10MB) to reduce per-request overhead and improve download throughput.

## 1.0.216 — 2026-02-06 00:47 -06:00
- Book detail modal now uses clearer checkout language (Check out / Return) and adds per-device offline controls (Download offline / Remove offline copy) with a device offline status label.
- Add GitHub Actions CI workflow to run `npm ci`, `npm test`, `npm run build`, and `npm audit --omit=dev` on pushes/PRs.

## 1.0.215 — 2026-02-05 23:46 -06:00
- Add Range support for device-side offline audiobook playback: large audiobook streams are cached in 5MB chunks and served back as `206 Partial Content` from the Service Worker so `<audio>` seeking works offline.

## 1.0.214 — 2026-02-05 23:16 -06:00
- Add device-side offline caching foundation (Service Worker) for My Library: checked-out books automatically cache their ebook/audiobook streams on supported browsers (HTTPS only), with progress ring updates driven by SW progress events.
- Add `GET /library/:id/offline-manifest` to provide a minimal authenticated file list for device caching.
- Clear device offline cache on logout via SW `CLEAR_ALL`.

## 1.0.213 — 2026-02-05 22:33 -06:00
- Fix “Unable to load EPUB” on macOS/desktop by vendoring JSZip at `vendor/jszip/jszip.min.js` and serving it from `/vendor/jszip/` (epub.js requires JSZip).

## 1.0.212 — 2026-02-05 21:49 -06:00
- Fix “Unable to load EPUB” by removing the incompatible epub.js `0.5.x alpha` dependency path; the browser reader is now vendored at `vendor/epub/epub.min.js` and served from `/vendor/epub/`.
- EPUB open now prefers an authenticated `ArrayBuffer` load (cookie auth) for archived `.epub` handling without relying on blob URL extensions.
- `npm ci` now runs clean (no deprecated warnings) and `npm audit` reports 0 vulnerabilities.

## 1.0.211 — 2026-02-05 21:04 -06:00
- Stop appending `?token=...` to same-origin media/image URLs when cookie auth is available (prevents token leakage in URLs and avoids stale token URL issues after refresh).

## 1.0.210 — 2026-02-05 20:50 -06:00
- Fix “Unable to load EPUB” regression after epub.js upgrade by providing a browser `xmldom` shim (epub.js UMD expects `window.xmldom` even though browsers already have DOMParser).

## 1.0.209 — 2026-02-05 17:05 -06:00
- Upgrade epub.js to `0.5.0-alpha.3` to remove the deprecated `@types/localforage` install warning (SSH updates now run clean with `npm ci`).
- Fix the Jest smoke test to validate the HTML shell without requiring the full Nest controller dependency graph.

## 1.0.208 — 2026-02-05 16:43 -06:00
- Remove Readium server/web integration and dependencies (r2-streamer-js / @readium/*), eliminating request-based audit vulns and SSH update warnings.
- Remove the `/library/readium/manifest` endpoint to remediate the critical CodeQL SSRF alert.
- `npm audit` now reports 0 vulnerabilities.

## 1.0.207 — 2026-02-05 16:22 -06:00
- Reduce epub.js viewport height by a small safety margin to prevent half-line clipping at the bottom of pages.

## 1.0.206 — 2026-02-05 16:13 -06:00
- Make `.epub-stage` an absolutely positioned inset (10px on all sides) so the rendered page is actually smaller and stops clipping.

## 1.0.205 — 2026-02-05 16:00 -06:00
- Apply EPUB inset padding/border to a dedicated `.epub-stage` wrapper (epub.js absolute layout ignores parent padding).

## 1.0.204 — 2026-02-05 15:51 -06:00
- Add an inset border and 10px padding to the EPUB viewport to prevent bottom-line clipping.

## 1.0.203 — 2026-02-05 15:24 -06:00
- Document epub.js pagination constraints in AGENTS.md to prevent regressions.

## 1.0.202 — 2026-02-05 15:14 -06:00
- Remove CSS overrides that interfered with epub.js pagination (overflow and column sizing) to stop intra-chapter page skipping.

## 1.0.201 — 2026-02-05 14:40 -06:00
- Serialize epub.js page turns (lock + queue) to prevent multi-page jumps from rapid/double-fired events.
- Debug overlay now includes nav lock state and queued turns.

## 1.0.200 — 2026-02-05 14:26 -06:00
- Stop forcing single-column EPUB layout; enforce column-fill auto + viewport column width so pages paginate correctly.
- Debug overlay now includes page/total, section index, and computed column settings.

## 1.0.199 — 2026-02-05 00:16 -06:00
- Force EPUB column width to the viewport to prevent hidden columns.

## 1.0.198 — 2026-02-05 00:11 -06:00
- Force EPUB single-column layout and theme overrides to prevent hidden pages.

## 1.0.197 — 2026-02-05 00:04 -06:00
- Clamp EPUB iframe/container widths and expand debug info with page/section.

## 1.0.196 — 2026-02-04 23:56 -06:00
- Update EPUB debug overlay on render/display so it doesn't stay pending.

## 1.0.195 — 2026-02-04 23:49 -06:00
- Make the EPUB debug overlay selectable/copyable.

## 1.0.194 — 2026-02-04 23:43 -06:00
- Add always-visible EPUB debug overlay inside the reader modal.

## 1.0.193 — 2026-02-04 23:34 -06:00
- Fix EPUB debug overlay build by removing template literal in embedded script.

## 1.0.192 — 2026-02-04 23:28 -06:00
- Add EPUB debug overlay to show page render metrics for blank-page diagnosis.

## 1.0.191 — 2026-02-04 23:16 -06:00
- Retry rendering empty EPUB pages instead of skipping them.

## 1.0.190 — 2026-02-04 22:56 -06:00
- Auto-skip blank EPUB pages between chapters without changing layout.

## 1.0.189 — 2026-02-04 22:43 -06:00
- Reset EPUB.js to default paginated layout and remove column overrides.

## 1.0.188 — 2026-02-04 22:31 -06:00
- Revert to paginated EPUB.js with enforced single-page spreads and column overrides.

## 1.0.187 — 2026-02-04 22:22 -06:00
- Hide EPUB.js scrollbars and enforce hidden overflow for single-page viewport.

## 1.0.186 — 2026-02-04 22:15 -06:00
- Switch EPUB.js to true single-page viewport by scrolling one screen at a time.

## 1.0.185 — 2026-02-04 22:07 -06:00
- Force EPUB.js to single-column CSS across content to stop split-page cutoffs.

## 1.0.184 — 2026-02-04 21:31 -06:00
- Switch EPUB.js to scrolled-doc layout to avoid split-page rendering.

## 1.0.183 — 2026-02-04 21:20 -06:00
- Narrow EPUB.js page width and lock spread width to avoid multi-page splits.

## 1.0.182 — 2026-02-04 21:09 -06:00
- Force EPUB.js spread/page settings to prevent double-page split views.

## 1.0.181 — 2026-02-04 21:03 -06:00
- Force single-column EPUB.js layout to eliminate split-page rendering.

## 1.0.180 — 2026-02-04 20:56 -06:00
- Adjust EPUB.js rendering to reduce blank pages and center content.

## 1.0.179 — 2026-02-04 20:48 -06:00
- Web now defaults to EPUB.js and hides Readium options (Readium mobile-only).

## 1.0.178 — 2026-02-04 20:25 -06:00
- Center Readium content within the iframe and use viewport positions for page stepping.

## 1.0.177 — 2026-02-04 20:16 -06:00
- Force Readium iframe centering and revert to navigator paging to avoid skipped pages.

## 1.0.176 — 2026-02-04 17:24 -06:00
- Center Readium frames and add fallback when next/prev doesn't advance.

## 1.0.175 — 2026-02-04 17:18 -06:00
- Use locator progression to resolve Readium next/prev so page turns stop skipping.

## 1.0.174 — 2026-02-04 17:09 -06:00
- Use position-based Readium navigation for next/prev and refine page centering styles.

## 1.0.173 — 2026-02-04 16:51 -06:00
- Center Readium pages inside the modal using injected layout styling.

## 1.0.172 — 2026-02-04 16:40 -06:00
- Center Readium page layout and compute synthetic positions to drive page counts.

## 1.0.171 — 2026-02-04 17:09 -06:00
- Pull Readium position list from manifest and use global page positions for counters.

## 1.0.170 — 2026-02-04 16:57 -06:00
- Fix Readium page counter state by lifting positions to shared scope.

## 1.0.169 — 2026-02-04 16:48 -06:00
- Center Readium pages and restore global page counters from positions.

## 1.0.168 — 2026-02-04 16:36 -06:00
- Keep Readium manifest readingOrder hrefs relative so EpubNavigator can attach frames.

## 1.0.167 — 2026-02-04 16:28 -06:00
- Ensure Readium locators include position indices so EpubNavigator can create frames.

## 1.0.166 — 2026-02-04 16:16 -06:00
- Apply Readium line-length defaults, normalize positions, and use PreferencesEditor to sync settings.

## 1.0.165 — 2026-02-04 16:04 -06:00
- Normalize Readium locator hrefs for navigation, adjust fit sizing, and keep progress stable.

## 1.0.164 — 2026-02-04 15:52 -06:00
- Provide Readium positions for EpubNavigator, log load errors, and further reduce default font size to fit the modal.

## 1.0.163 — 2026-02-04 15:43 -06:00
- Switch Readium EPUB navigation to EpubNavigator for true page turns, restart support, and better fit.

## 1.0.162 — 2026-02-04 15:32 -06:00
- Fix Readium link extraction to use manifest link arrays so all spine pages load.

## 1.0.161 — 2026-02-04 15:22 -06:00
- Rewrite Readium manifest links away from localhost, preserve query strings, and reduce default zoom to fit the modal.

## 1.0.160 — 2026-02-04 13:59 -06:00
- Tune Readium zoom + layout defaults to fit the modal and reduce skipped pages.

## 1.0.159 — 2026-02-04 13:44 -06:00
- Proxy Readium manifests through BMS to drop oversized Link headers.

## 1.0.158 — 2026-02-04 13:37 -06:00
- Force Link header removal during Readium responses to avoid proxy failures.

## 1.0.157 — 2026-02-04 13:28 -06:00
- Strip Readium Link headers to avoid proxy 502s on manifest responses.

## 1.0.156 — 2026-02-04 12:05 -06:00
- Route Readium manifests through a local internal base to avoid 502s when using a public domain.

## 1.0.155 — 2026-02-04 11:50 -06:00
- Force Readium manifests to use the current origin for local stream URLs to avoid 502s.

## 1.0.154 — 2026-02-03 23:38 -06:00
- Normalize Readium manifest link arrays to avoid crashing when a single link is returned.

## 1.0.153 — 2026-02-03 23:34 -06:00
- Proxy /pub requests to Readium so EPUB resources resolve correctly.

## 1.0.152 — 2026-02-03 23:29 -06:00
- Force Readium to resolve asset URLs under the /readium base to avoid 404s.
- Remove stray reader settings hook from the login page script.

## 1.0.151 — 2026-02-03 22:59 -06:00
- Retry Readium manifest with refreshed book detail to pick up updated stream URLs.

## 1.0.150 — 2026-02-03 22:47 -06:00
- Retry Readium manifest fetch after refreshing auth when tokens expire mid-open.

## 1.0.149 — 2026-02-03 22:37 -06:00
- Invalidate the library cache to force updated stream URLs with file extensions.

## 1.0.148 — 2026-02-03 22:24 -06:00
- Add filename-based stream routes so Readium can detect EPUBs by URL extension.

## 1.0.147 — 2026-02-03 22:12 -06:00
- Ensure ebook streams emit correct content-type headers (EPUB/PDF) so Readium can open manifests.

## 1.0.146 — 2026-02-03 22:02 -06:00
- Fix Readium reader selection: avoid resetting the chosen reader engine to epub.js before open.

## 1.0.145 — 2026-02-03 21:52 -06:00
- Add Readium call/result/error logging and guard against missing reader view.

## 1.0.144 — 2026-02-03 21:40 -06:00
- Force no-cache headers on app shell routes so browsers always fetch the latest UI.

## 1.0.143 — 2026-02-03 21:25 -06:00
- Add explicit Readium start/fallback logs and a FORCE_READIUM diagnostic mode.

## 1.0.142 — 2026-02-02 23:00 -06:00
- Fix Settings module DI so reader settings logging doesn't crash the server.

## 1.0.141 — 2026-02-02 22:56 -06:00
- Stabilize Readium startup by waiting for module globals and logging readiness failures.
- Harden reader settings storage against missing DB tables (avoid 500s).

## 1.0.140 — 2026-02-02 22:46 -06:00
- Add VERBOSE_LOGS mode with full request/response tracing (redacted payloads).

## 1.0.139 — 2026-02-02 22:33 -06:00
- Add server-side Readium and library stream logging to trace blank-page EPUB issues.

## 1.0.138 — 2026-02-02 22:21 -06:00
- Add verbose Readium reader logging to trace blank-page rendering issues.

## 1.0.137 — 2026-02-02 22:13 -06:00
- Normalize Readium resource links and tweak navigator prefs to prevent blank pages between chapters.

## 1.0.136 — 2026-02-02 22:06 -06:00
- Relax Readium theme overflow to avoid blank pages between sections.

## 1.0.135 — 2026-02-02 21:58 -06:00
- Fix client-side regex escaping that was breaking the app script during login.

## 1.0.134 — 2026-02-02 21:52 -06:00
- Add client boot/error logging to trace JS failures during login.

## 1.0.133 — 2026-02-02 21:45 -06:00
- Add client-side auth debug logging endpoint to trace login/session failures.

## 1.0.132 — 2026-02-02 21:40 -06:00
- Add /api/me request/response logging to pinpoint auth session failures.

## 1.0.131 — 2026-02-02 21:34 -06:00
- Fall back to the server bootstrap user if /api/me fails, to avoid a signed-out shell.

## 1.0.130 — 2026-02-02 21:29 -06:00
- Fix auth logging dependency injection so the server boots (resolves 502).

## 1.0.129 — 2026-02-02 21:24 -06:00
- Add detailed server-side login/bootstrap logs for auth troubleshooting.

## 1.0.128 — 2026-02-02 21:18 -06:00
- Redirect auth=1 bootstrap requests to a clean / URL once tokens validate.

## 1.0.127 — 2026-02-02 21:12 -06:00
- Force the shell to redirect to /login whenever no bootstrap user exists.

## 1.0.126 — 2026-02-02 21:02 -06:00
- Decode auth query tokens before bootstrapping so login completes successfully.

## 1.0.125 — 2026-02-02 20:53 -06:00
- Redirect auth=1 failures back to the login screen to avoid a signed-out shell.

## 1.0.124 — 2026-02-02 20:44 -06:00
- Bootstrap login using query tokens on the root route to guarantee a signed-in shell.

## 1.0.123 — 2026-02-02 19:56 -06:00
- Persist login tokens in localStorage/window.name as a fallback when cookies are not read by the shell.

## 1.0.122 — 2026-02-02 19:29 -06:00
- Route login completion through /auth/complete so cookies are set server-side and the shell boots authenticated.

## 1.0.121 — 2026-02-02 19:09 -06:00
- Auto-persist login tokens from the auth hash into cookies and reload to prevent signed-out shells.

## 1.0.120 — 2026-02-02 19:01 -06:00
- Redirect to the login page when no valid access token is present to avoid a signed-out shell.

## 1.0.119 — 2026-02-02 18:50 -06:00
- Normalize Readium manifest links to resolve relative resources consistently and reduce blank pages.

## 1.0.118 — 2026-02-02 18:43 -06:00
- Fix Readium resource fetching by anchoring manifest-relative URLs, and align Readium reader UI with overlay arrows/controls.

## 1.0.117 — 2026-02-02 18:31 -06:00
- Switch Readium to use the built-in HTTP fetcher to avoid blank pages.

## 1.0.116 — 2026-02-02 18:24 -06:00
- Use side-arrow navigation for ebooks and reduce scrollbar/zoom artifacts.

## 1.0.115 — 2026-02-02 18:17 -06:00
- Gate legacy epub.js reader behind a settings feature flag and make Read default to Readium.

## 1.0.114 — 2026-02-02 14:09 -06:00
- Bump version and redeploy after Node/npm upgrade.

## 1.0.113 — 2026-02-02 14:04 -06:00
- Add Readium streamer + navigator dependencies and wire a Readium (beta) EPUB reader option.

## 1.0.112 — 2026-02-02 11:28 -06:00
- Store reader progress in the DB with server-side sync/reset endpoints and UI Sync/Restart controls.

## 1.0.111 — 2026-02-02 00:42 -06:00
- Fix admin reset UI requests to avoid template literals that break the HTML build.

## 1.0.110 — 2026-02-02 00:38 -06:00
- Fix admin reset UI rendering so the build succeeds.

## 1.0.109 — 2026-02-02 00:35 -06:00
- Encrypt stored 2FA secrets, add admin reset actions, and ship a reset-2fa command for env-driven resets.

## 1.0.108 — 2026-02-02 00:13 -06:00
- Preserve the 2FA challenge token via a readable cookie fallback on the OTP step.

## 1.0.107 — 2026-02-02 00:07 -06:00
- Persist the 2FA challenge token through the OTP step to avoid missing-token logins.

## 1.0.106 — 2026-02-02 00:03 -06:00
- Fix OTP validation so only the correct user's 2FA codes are accepted.

## 1.0.105 — 2026-02-01 23:56 -06:00
- Keep non-admins on Accounts page by returning 403 for admin endpoints and skipping user lists.

## 1.0.104 — 2026-02-01 23:41 -06:00
- Refresh transitive dependencies to remove deprecated build tooling packages and update xmldom.

## 1.0.103 — 2026-02-01 23:36 -06:00
- Show login errors in red beneath the Log in button on the login page.

## 1.0.102 — 2026-02-01 23:30 -06:00
- Add a two-step 2FA login flow with a short-lived challenge token so OTP is entered separately.

## 1.0.101 — 2026-02-01 23:23 -06:00
- Fix 2FA verification to use otplib's boolean result so existing codes validate.

## 1.0.100 — 2026-02-01 23:20 -06:00
- Document the SSH host alias and deploy command in AGENTS/HANDOFF.

## 1.0.99 — 2026-02-01 23:11 -06:00
- Show the OTP input on the login page when 2FA is required and preserve it via the login redirect.

## 1.0.98 — 2026-02-01 23:03 -06:00
- Fix login 2FA prompt by returning twoFactorRequired and revealing the OTP field on 401s.

## 1.0.97 — 2026-02-01 22:53 -06:00
- Use otplib functional helpers for TOTP generation/verification to fix builds.

## 1.0.96 — 2026-02-01 22:49 -06:00
- Switch 2FA import to otplib namespace to fix module resolution.

## 1.0.95 — 2026-02-01 22:46 -06:00
- Fix otplib import path for 2FA builds.

## 1.0.94 — 2026-02-01 22:43 -06:00
- Add user welcome email on account creation, password reset UI/linking, and 2FA (TOTP) setup with QR codes.

## 1.0.93 — 2026-02-01 22:23 -06:00
- Fix checkbox alignment by scoping form-grid input widths to text fields only.

## 1.0.92 — 2026-02-01 22:18 -06:00
- Left-align the Bookdarr HTTPS checkbox under its label.

## 1.0.91 — 2026-02-01 22:14 -06:00
- Rename Protocol to Use HTTPS and stack the checkbox beneath the label.

## 1.0.90 — 2026-02-01 22:08 -06:00
- Guard Bookdarr connection tests against non-local hosts to prevent SSRF.

## 1.0.89 — 2026-02-01 22:04 -06:00
- Add a manual Book Pool refresh button that rebuilds the cached library.

## 1.0.88 — 2026-02-01 21:59 -06:00
- Keep Bookdarr HTTPS checkbox anchored right while placing the label to its left.

## 1.0.87 — 2026-02-01 21:52 -06:00
- Place the Bookdarr HTTPS label to the left of the checkbox.

## 1.0.86 — 2026-02-01 21:47 -06:00
- Keep the Bookdarr HTTPS label on a single line next to its checkbox.

## 1.0.85 — 2026-02-01 21:44 -06:00
- Move Bookdarr HTTPS checkbox next to its label for tighter alignment.

## 1.0.84 — 2026-02-01 21:40 -06:00
- Use a non-sending SMTP check endpoint for status dots so test emails only send on demand.

## 1.0.83 — 2026-02-01 21:36 -06:00
- Align Bookdarr HTTPS toggle under the Protocol label.

## 1.0.82 — 2026-02-01 21:33 -06:00
- Make SMTP fields use the same stacked label layout as Bookdarr and disable Bookdarr port when HTTPS is checked.

## 1.0.81 — 2026-02-01 21:26 -06:00
- Force SMTP field labels above inputs within the form grid.

## 1.0.80 — 2026-02-01 21:23 -06:00
- Align SMTP settings fields with a dedicated form grid layout.

## 1.0.79 — 2026-02-01 21:16 -06:00
- Fix SMTP From Name fallback wiring for test emails.

## 1.0.78 — 2026-02-01 21:15 -06:00
- Fix settings types to include SMTP From Name in public + private config.

## 1.0.77 — 2026-02-01 21:13 -06:00
- Add SMTP From Name support and include it in SMTP config + test email handling.

## 1.0.76 — 2026-02-01 21:08 -06:00
- Add SMTP title status dot and live connectivity check for configured SMTP.

## 1.0.75 — 2026-02-01 20:58 -06:00
- Add SMTP test email endpoint + UI button and show Bookdarr title status based on live connectivity.

## 1.0.74 — 2026-02-01 20:49 -06:00
- Remove Book Pool Path from Settings and add Bookdarr connection test endpoint + UI indicator.

## 1.0.73 — 2026-02-01 20:42 -06:00
- Ensure SettingsModule has UserEntity repository available for AdminGuard.

## 1.0.72 — 2026-02-01 20:40 -06:00
- Export AdminGuard from AuthModule so settings guards resolve at runtime.

## 1.0.71 — 2026-02-01 20:35 -06:00
- Fix SMTP settings controller type import to satisfy isolatedModules builds.

## 1.0.70 — 2026-02-01 20:32 -06:00
- Simplify Settings to editable panels, add SMTP configuration UI + API, and remove diagnostics UI.
- Restrict Create User panel to admins and hide auth secret controls.

## 1.0.69 — 2026-02-01 20:12 -06:00
- Disable page-turn animation on touch devices to prevent flicker during swipes.
- Update My Library download progress overlays in-place to stop cover flicker.

## 1.0.68 — 2026-02-01 20:04 -06:00
- Raise reader control bar stacking order so desktop buttons stay clickable.

## 1.0.67 — 2026-02-01 17:18 -06:00
- Fix desktop reader height calculation build error.

## 1.0.66 — 2026-02-01 17:17 -06:00
- Recompute reader layout height on open/resize so desktop EPUB iframes can render.

## 1.0.65 — 2026-02-01 17:09 -06:00
- Force desktop EPUB render sizing and retry display if the iframe stays empty.

## 1.0.64 — 2026-02-01 17:04 -06:00
- Fix desktop EPUB rendering by forcing full-height iframes, hiding overlay UI outside touch mode, and adding a resize nudge.

## 1.0.63 — 2026-02-01 16:59 -06:00
- Fix sqlite compatibility for offline download error storage.

## 1.0.62 — 2026-02-01 16:54 -06:00
- Add a desktop EPUB fallback loader that mounts from the direct stream URL if blob loading fails.

## 1.0.61 — 2026-01-31 18:15 -06:00
- Queue per-user offline downloads on checkout and surface progress in My Library cards.
- Stream cached offline files when available and mark returns as read with a resettable toggle.
- Remove the Downloads page from navigation and redirect /downloads to My Library.

## 1.0.60 — 2026-01-31 17:31 -06:00
- Tie EPUB page numbers to explicit page turns to stop fast-swiping from skewing the counter.

## 1.0.59 — 2026-01-31 16:26 -06:00
- Rebase EPUB page numbering on the first seen page and apply navigation-aware offsets to stop initial jumps.

## 1.0.58 — 2026-01-31 16:13 -06:00
- Enforce monotonic EPUB page numbering to prevent resets or backward jumps while reading.

## 1.0.57 — 2026-01-31 16:08 -06:00
- Persist EPUB displayed-page offsets per viewport so page numbers remain stable after reopening.

## 1.0.56 — 2026-01-31 16:01 -06:00
- Stabilize EPUB page numbers by resolving section indices and preventing resets when moving through the spine.

## 1.0.55 — 2026-01-31 15:56 -06:00
- Restore swipe navigation by letting the gesture layer capture touches while preserving overlay buttons.

## 1.0.54 — 2026-01-31 15:38 -06:00
- Fix EPUB overlay interactions and compute displayed-page numbering per chapter for sequential page counts.

## 1.0.53 — 2026-01-31 15:23 -06:00
- Fix EPUB page numbering to use location-based counts for consistent sequential paging.

## 1.0.52 — 2026-01-31 15:17 -06:00
- Align EPUB rendering with Bookdarr defaults, reapply reader themes per render, and fix blank-page pagination issues.

## 1.0.51 — 2026-01-31 13:35 -06:00
- Improve EPUB touch gestures, fix overlay toggling, and use displayed page numbers with forced single-page spreads.

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
