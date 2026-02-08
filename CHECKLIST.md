# Checklist — Bookdarr Media Server (BMS)

This checklist is specifically for hardening BMS so we can confidently start the iPhone app.
Each item has a clear pass/fail expectation.

## 1. Mobile-Ready API Contract (Versioned) [x]
- Pass: All endpoints used by mobile live under `/api/v1/*` (or equivalent stable prefix) and are documented in `README.md` or `HANDOFF.md`.
- Pass: Any breaking change requires a new version prefix (`/api/v2`), not silent changes.
- Pass: A small integration test suite asserts key auth + library + stream flows (runs in CI).

## 2. Auth And Session Hardening (Cookies + Rotation) [x]
- Pass: Access/refresh cookies are `HttpOnly`, `Secure`, and have an intentional `SameSite` policy for our cross-origin needs.
- Pass: Refresh tokens rotate (one-time-use); re-use invalidates the session.
- Pass: Sessions are multi-device: refresh tokens include a stable `sid` and server stores session state in `auth_sessions` (logout revokes only that device session).
- Pass: Changing password disables old refresh tokens; changing 2FA disables old sessions for that user.
- Pass: Login, refresh, logout, password reset, and 2FA endpoints are rate-limited.
  - Verified: `test/checklist-2-6.e2e-spec.ts`

## 3. 2FA (TOTP) Hardening And Recovery [x]
- Pass: 2FA secret is encrypted at rest; verify we never log it.
- Pass: Add backup codes (one-time use) so users can recover without admin intervention.
- Pass: Admin can reset user 2FA and reset user password (audited event).
- Pass: Login UX is always two-step (password then OTP), with clear red error text on failure.
  - Verified: `test/checklist-2-6.e2e-spec.ts`

## 4. Password Reset Security (SMTP) [x]
- Pass: Password reset token is single-use, short TTL, hashed in DB (store only hash).
- Pass: Emails are sent with a configured `From Name` and `From Address` and a working "Send test email" button.
- Pass: Reset flow works from iOS Safari and does not require localStorage.
  - Verified: `test/checklist-2-6.e2e-spec.ts`

## 5. Streaming + Range Reliability (Audiobook/Ebook) [x]
- Pass: Audiobook streaming supports Range requests and seeking through reverse proxy.
- Pass: Long streams survive token refresh without breaking playback.
- Pass: Ebook streaming works consistently across Chrome/Safari/iOS.
  - Verified: `test/checklist-2-6.e2e-spec.ts`

## 6. Offline Concepts (Server Cache vs Device Offline) Are Unambiguous [x]
- Pass: UI language clearly distinguishes `Server cache` (VM disk) from `Offline on this device` (browser/app storage).
- Pass: A device offline failure never reads as a streaming failure (no false "Failed" when streaming works).
  - Verified: `src/app.controller.spec.ts`

## 7. Observability (Logging + Correlation) [ ]
- Pass: Structured logs with timestamps + request IDs for every request.
- Pass: Auth events are logged (login success/fail, refresh, logout, password reset request, 2FA enable/disable).
- Pass: Bookdarr sync/cache events are logged (refresh starts, counts, failures).
- Pass: Reader events are logged at a sane level (open book, turn page, save progress), without leaking tokens.

## 8. Data Integrity (Migrations + Backups) [x]
- Pass: TypeORM migrations exist for all schema changes (do not rely on `synchronize` in production-like installs).
- Pass: Document SQLite backup/restore for the VM (`data/bms.sqlite`) and ensure restore works.
- Pass: DB file permissions are correct for the systemd user (avoid SQLITE_READONLY regressions).

## 9. Security Hardening (App + Headers) [x]
- Pass: SSRF protection is enforced for Bookdarr connection tests (local/private ranges only, explicit allow-list).
- Pass: CSP and other sensible headers (X-Content-Type-Options, Referrer-Policy, etc.) are set on the app shell.
- Pass: Inputs validated server-side (DTO validation) for all public endpoints.
- Pass: No sensitive tokens appear in URLs (prefer cookie auth).

## 10. Dependency Hygiene (SSH Updates Should Be Clean) [ ]
- Pass: `npm ci` runs without critical vulnerability findings.
- Pass: Deprecation warnings are either removed (preferred) or have a tracked issue explaining why they are unavoidable.
- Pass: CI runs `npm audit --omit=dev` (or equivalent) and fails on criticals.

## 11. Deploy/Recovery (Repeatable) [ ]
- Pass: `scripts/install-bms.sh` reliably installs/updates on a fresh Ubuntu VM.
- Pass: Document "roll-forward only" recovery steps when something breaks (service status, logs, restart, rebuild).
- Pass: The systemd service has sane restart policy and does not spin forever without logs.

## 12. Mobile Prep (Reader Progress + Sync Model) [ ]
- Pass: Progress is stored server-side per user/book and works across devices.
- Pass: Provide a “Sync progress” action and a “Restart book” action that are deterministic.
- Pass: Define the offline behavior contract for mobile (what’s stored locally vs synced back).

## 13. Admin/Permissions Tightening [ ]
- Pass: Non-admin users cannot access admin pages/endpoints (Accounts, clear cache, user creation).
- Pass: Authorization failures show a clear message; they never log users out unexpectedly.

## 14. Diagnostics (Dev Required, Later Opt-In) [ ]
- Pass: Development diagnostics are required and useful.
- Pass: Production release plan exists to switch diagnostics to opt-in without code churn.
