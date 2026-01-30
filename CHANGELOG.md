# Changelog — Bookdarr Media Server (BMS)

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
