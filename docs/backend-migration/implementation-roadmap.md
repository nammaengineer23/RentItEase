# RentItEase hybrid Firebase + PostgreSQL — migration roadmap

**Status:** Proposed architecture; Phase 0 audit is the prerequisite.  
**Baseline:** `main` at `71e66aeac7923f96e0fd7853bf84360459d6754b` (2026-11-01).  
**Product constraint:** Preserve the existing RentItEase product and Google Sign-In-only user experience.  
**Data safety constraint:** Never run mutating E2E, seed, destructive or experimental migration work against production PostgreSQL.

## 1. Architecture decision

Adopt Firebase services around the existing NestJS/Prisma/PostgreSQL application. Move API hosting from Railway to Google Cloud Run only after staging and production cutover gates pass.

### Target responsibility map

| Layer | Target | Source of truth / boundary |
|---|---|---|
| Flutter Android + Flutter web | Existing Flutter app | Client only; no privileged credentials |
| Identity | Firebase Authentication | Firebase verifies identity; PostgreSQL owns RentItEase account, role and active state |
| API runtime | NestJS on Cloud Run | Existing REST contract under `/api/v1` |
| API session | Existing RentItEase access/refresh JWTs initially | Preserve current app contract; Firebase ID token is exchanged at login |
| Business database | Existing Neon PostgreSQL + Prisma | Authoritative transactional record |
| Push | Firebase Cloud Messaging | PostgreSQL owns device registration and notification history |
| Uploads | Firebase Storage | PostgreSQL owns file metadata, parent ownership and access policy |
| Real-time data | Firestore only if justified later | Rebuildable projections only; never competing business records |
| Web/DNS | Cloudflare | Keep current web delivery and domain |
| Payments | Razorpay | Keep server-authoritative order, verification, webhook and idempotency flow |

### API request identity flow

1. Flutter signs in through Google and Firebase Authentication.
2. Flutter exchanges its Firebase ID token through the existing Firebase login endpoint.
3. NestJS Firebase Admin verifies the token and resolves the Firebase identity to the PostgreSQL RentItEase account.
4. NestJS returns the existing RentItEase access and refresh tokens.
5. Existing API routes continue to authorize requests using the RentItEase JWT and PostgreSQL role/ownership checks.

Do not switch all protected API requests to Firebase ID tokens in the hosting migration. If direct Firebase-token authorization is later preferred, design it as a separately versioned, fully tested change.

## 2. Non-negotiable data and security rules

- PostgreSQL remains authoritative for users, roles, properties, enquiries, bookings, leases, invoices, payments, moderation, audit logs, notification history and device registrations.
- No dual-write of the same authoritative entity to PostgreSQL and Firestore.
- Firestore, if adopted, stores only rebuildable/read-optimized projections with a documented owner and reconciliation process.
- Never trust client-supplied user IDs, role claims or ownership assertions.
- Resolve Firebase UID to an existing PostgreSQL account; account linking must be explicit and collision-safe.
- Check active/deleted account state and current PostgreSQL role on protected operations.
- Preserve tenant/owner/admin isolation and marketplace moderation gates.
- Keep Razorpay secret material and webhook verification server-side.
- Keep Firebase Admin credentials and database credentials in Secret Manager, never Flutter or repository files.
- Use App Check as an additional abuse signal, not as a replacement for authentication/authorization.
- Private file access must remain server-authorized, ownership-checked and short-lived.
- Do not expose service-account JSON/private keys in build artifacts or logs.

## 3. Phased delivery

### Phase 0 — Repository audit and baseline (this PR)

Deliverable: read-only inventory, architecture decision, risks and migration roadmap. No runtime changes.

Exit criteria: reviewed audit; confirm production project identity, Neon region/pooling, Railway deployment binding, actual storage driver and E2E isolation policy.

### Phase 1 — Identity contract hardening

- Map Firebase UID to the existing PostgreSQL User using an explicit, unique identity mapping.
- Audit existing users and define a safe backfill/linking policy; do not match accounts on unverified email.
- Preserve existing access/refresh token response contract initially.
- Ensure Firebase token verification validates project/audience and rejects expired, revoked or invalid tokens according to policy.
- Preserve user activation/deletion and role checks from PostgreSQL.
- Align API documentation with the actual Google login endpoint and remove stale "Phone Authentication" descriptions.
- Audit and safely deprecate unused OTP/password routes in a separate approved change, consistent with Google-only product behavior.
- Test first sign-in, returning sign-in, existing account linking, email collision, inactive user, logout, token refresh, account switch and revoked Firebase session.

Exit criteria: Android and web Google Sign-In pass; no account duplication; all existing tenant/owner/admin access tests pass; API clients continue to work unchanged.

### Phase 2 — App Check and API security

- Search all backend code for existing App Check verification before implementing a second guard.
- Verify `X-Firebase-AppCheck` using the official server-side verification path.
- Start in audit/monitor mode; measure missing/invalid tokens by app/platform.
- Configure debug tokens only for local/staging; production Android uses Play Integrity; web uses reCAPTCHA Enterprise.
- Add explicit route exemptions only when justified (for example health probes and provider webhooks), with independent authentication/signature controls.
- Enforce only after valid production traffic is observed and rollout/rollback is tested.

Exit criteria: forged/expired tokens rejected in staging, production valid clients unaffected, no App Check secrets logged.

### Phase 3 — Reliable push delivery

- Keep FCM token registration in PostgreSQL `UserDevice`.
- Keep notification history and read state in PostgreSQL.
- Add a transactional outbox written in the same PostgreSQL transaction as each business event.
- Process outbox rows asynchronously with bounded retries, exponential backoff, idempotency and dead-letter visibility.
- Remove invalid FCM tokens and record provider outcomes without losing the underlying business event.
- Respect per-user notification preferences and avoid duplicate event sends.
- Test token refresh, logout/unregister, disabled notifications, provider outage, retry and duplicate processing.

Exit criteria: business transaction commits even if FCM is unavailable; outbox retry eventually delivers; duplicate events are suppressed.

### Phase 4 — Storage hardening and controlled migration

- First resolve the `STORAGE_DRIVER` configuration versus Firebase-only implementation discrepancy.
- Inventory current Firebase Storage objects, Cloudinary/social assets, any local uploads and R2 configuration actually used in production.
- Preserve current public image URLs and private chat attachment authorization.
- Standardize object metadata: owner, parent entity, visibility, content type, size, checksum, provider and object key.
- Use server-side authorization for private upload/download; apply file type/size validation and safe filenames.
- Migrate only after an idempotent inventory/copy/verify process exists. Keep old objects and URLs available during rollback.
- Do not copy secrets or private download tokens into logs.

Exit criteria: property image compatibility, private chat attachment isolation, integrity checks and rollback validated in staging.

### Phase 5 — Cloud Run staging platform

- Add a production-grade backend Dockerfile using a pinned Node runtime and deterministic dependency installation.
- Build and publish immutable images to Artifact Registry from GitHub Actions.
- Use a dedicated Google Cloud service account with least-privilege IAM.
- Inject database, JWT, Firebase Admin, mail, Razorpay and social integration secrets from Secret Manager.
- Configure region based on measured Neon location/latency, not an assumed region.
- Configure Cloud Run request timeout, concurrency, minimum/maximum instances and CPU/memory deliberately.
- Budget total database connections across max instances and Prisma pool sizes; use Neon pooled TLS connection string as appropriate.
- Add startup/readiness health checks, structured logs, request IDs, error reporting, latency and saturation alerts.
- Ensure migrations are a separate controlled deployment step; do not run schema migrations on every autoscaled application instance.
- Deploy to staging first and run the full isolated E2E suite only against isolated Neon staging.

Exit criteria: staging Cloud Run API healthy, all required secrets present, migrations status verified on staging, all backend/Flutter/admin and isolated E2E checks pass.

### Phase 6 — Production cutover

Preconditions:

- Phase 5 staging acceptance signed off.
- Production database backup and restore procedure recently verified.
- No outstanding schema migration or E2E isolation blocker.
- Current Railway deployment and rollback revision recorded.
- Cloud Run secrets/IAM, health checks, logs and alerts verified.
- API compatibility verified against existing Android/web releases.

Cutover:

1. Deploy an immutable Cloud Run production revision without routing traffic.
2. Verify startup, health endpoint, DB connectivity and read-only authenticated checks.
3. Verify login/session, property read/search, owner dashboard, admin read paths and notification registration.
4. Shift a small traffic percentage using a controlled routing mechanism.
5. Monitor error rate, latency, auth failures, database connections and payment webhook outcomes.
6. Increase traffic gradually only if metrics remain healthy.
7. Keep Railway deployment and its configuration available as rollback until the agreed observation window completes.

Rollback:

- Shift API traffic back to the last known-good Railway deployment.
- Do not reverse database migrations automatically.
- Use only backward-compatible schema changes during the transition.
- Preserve logs and incident details; diagnose before another cutover attempt.

Exit criteria: Cloud Run serves all production API traffic stably through the existing API domain and rollback has been exercised or proven.

### Phase 7 — Cost, performance and optional Firestore

- Compare actual Cloud Run + Neon + Firebase + Cloudflare cost against Railway baseline.
- Tune Cloud Run scale-to-zero/instance settings against cold-start and latency requirements.
- Tune Prisma pool and Neon capacity using measured concurrency.
- Add caching only for safe, invalidatable read paths.
- Introduce Firestore only for a clearly defined real-time projection use case, with one-way/outbox-driven updates from PostgreSQL and a rebuild procedure.
- Do not move payments, invoices, leases, bookings or authorization state to Firestore.

Exit criteria: cost and reliability targets measured; Firestore remains optional and bounded to approved projections.

### Phase 8 — Railway retirement

- Confirm Cloud Run is stable through the agreed production observation period.
- Confirm rollback window and database compatibility period have ended.
- Remove Railway secrets only after no production traffic depends on them.
- Disable Railway auto-deploy only after cutover sign-off.
- Archive deployment/incident instructions and verify disaster recovery.

Exit criteria: no live API dependency on Railway; deployment and recovery documentation current.

## 4. CI/CD policy

- Flutter Fast Check: every normal PR.
- Backend CI: every backend PR.
- Auth/security-specific tests: relevant PRs.
- Cloud Run staging deploy: only infrastructure/deployment PRs and manual approved staging runs.
- Isolated Neon E2E: backend/release milestones only; never production DB.
- Android release builds: release milestones only.
- Production deploy: controlled after staging acceptance and explicit approval.
- Never allow a production remote E2E workflow to create fixtures or mutate business data. Review/retarget the existing Release E2E workflow before future runs.

## 5. Rollout gates and acceptance matrix

| Gate | Required evidence |
|---|---|
| Identity | Google login, UID mapping, no duplicate accounts, current role checks |
| Authorization | Tenant/owner/admin cross-account negative tests |
| App Check | Server verification, monitor-to-enforce rollout and rollback |
| Push | Durable outbox, retry, dedupe and invalid token handling |
| Storage | URL compatibility, private-file access tests and integrity verification |
| Database | Neon pooled connection test, connection budget and staging migration status |
| Hosting | Cloud Run health, logs, autoscaling and secrets/IAM |
| Cutover | API compatibility, canary metrics and tested Railway rollback |
| Cost | Actual bill and latency comparison |
| Data safety | No production E2E mutations; backups/restore documented |

## 6. Open decisions to close during implementation

1. Confirm production Firebase project ID and enabled Google provider settings.
2. Confirm production Neon region, pooler endpoint and current connection limits.
3. Confirm current Railway production service, main-branch auto-deploy and API domain routing.
4. Confirm the actual production `STORAGE_DRIVER` and all storage providers/object locations.
5. Define the production App Check enforcement policy and any legitimate webhook/health exemptions.
6. Agree on Cloud Run region, billing account, budget alerts and maximum spend/instance guardrails.
7. Confirm the existing Release E2E workflow is isolated from production before allowing further mutating test runs.

## 7. Phase 0 implementation boundary

This roadmap does not authorize production changes. Every implementation phase must be a separate reviewable PR with its own tests and rollout/rollback plan. Phase 0 changes documentation only.
