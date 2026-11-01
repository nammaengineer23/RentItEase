# Phase 2 — Firebase App Check and API security

## Current-state audit (2026-11-01)

- Flutter declares `firebase_app_check` and activates App Check after the first frame so provider initialization cannot block launch.
- Android release uses Play Integrity; Android debug uses the debug provider. Apple uses App Attest with DeviceCheck fallback; web uses reCAPTCHA Enterprise (the web site key is supplied through `APP_CHECK_WEB_SITE_KEY`).
- Flutter's shared Dio `ApiClient` attempts to fetch an App Check token and sends it as `X-Firebase-AppCheck`. Token acquisition is deliberately best-effort so App Check startup/provider failures do not break existing authentication or API calls.
- The backend previously did not verify App Check tokens. Its CORS allowlist also omitted `X-Firebase-AppCheck`, which could prevent browser preflight requests from passing.
- RentItEase authentication remains the existing Firebase ID-token exchange followed by the existing RentItEase access/refresh JWT contract. App Check is an additional app/device attestation signal, not a replacement for Firebase Auth or API JWT authorization.

## Phase 2 implementation

- Verify supplied App Check tokens with Firebase Admin `verifyToken`; do not trust client-supplied claims.
- Add a global guard with three modes:
  - `disabled`: no App Check verification.
  - `monitor` (default): verify supplied tokens and log missing/invalid tokens, but allow the request.
  - `enforce`: reject requests with missing or invalid tokens using HTTP 403.
- Health probes and CORS preflight requests are exempt.
- Never log token contents.
- Allow the App Check header through the existing exact CORS origin policy.
- No Firebase Auth/JWT/role behavior is changed by App Check.

## Safe rollout

1. Deploy with `APP_CHECK_MODE=monitor` (the default) and review missing/invalid-token rates by client platform and app version.
2. Confirm Android release builds are registered in Firebase with the correct package and Play App Signing SHA-256/certificate configuration; register debug provider tokens only for controlled development devices.
3. Confirm the reCAPTCHA Enterprise site key and allowed web domains for Flutter web.
4. Confirm iOS app registration and App Attest/DeviceCheck capability where applicable.
5. Only after platform coverage is verified, enable enforcement gradually for a controlled cohort or route group. Do not switch the whole production API to `enforce` as part of this PR.
6. Keep a rollback path: set `APP_CHECK_MODE=monitor` (or `disabled` temporarily) without changing auth credentials or database state.

## Operational safety

- The default is monitor-only; no production enforcement is enabled by this change.
- No production secrets, Firebase console settings, API deployment, database migrations, or database data are changed.
- Automated tests use mocks and do not contact Firebase production services or any database.
- App Check does not replace authentication, authorization, rate limiting, validation, or tenant-level access controls.
