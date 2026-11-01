# RentItEase backend migration — Phase 0 repository audit

**Audit date:** 2026-11-01  
**Repository:** `nammaengineer23/RentItEase`  
**Baseline branch:** `main`  
**Baseline commit:** `71e66aeac7923f96e0fd7853bf84360459d6754b`  
**Scope:** Read-only repository and GitHub Actions inspection. This document records observed source configuration; it is not a production environment attestation.

## Executive summary

RentItEase is already a hybrid application in practice:

- Flutter Android and Flutter web clients initialize Firebase.
- The NestJS API uses Firebase Admin SDK for Firebase ID-token verification, Firebase Storage and Firebase Cloud Messaging.
- PostgreSQL accessed through Prisma remains the system of record for application users, properties, bookings, leases, invoices, payments, notifications, device tokens, moderation and audit data.
- Cloudflare Workers serves the built Flutter web application.
- Railway configuration describes the existing NestJS API deployment and Prisma migration pre-deploy command.

The migration should therefore **standardize and improve the existing integration**, not introduce Firebase wholesale. The least disruptive hosting target is Cloud Run running the existing NestJS container, while keeping Neon PostgreSQL and the existing `/api/v1` contract.

No application code, infrastructure configuration, production variables, database schema or production deployment was changed by this Phase 0 audit.

## 1. Frozen baseline and repository inventory

| Item | Observed baseline |
|---|---|
| Main commit | `71e66aeac7923f96e0fd7853bf84360459d6754b` |
| Backend package | `backend/package.json`, version `1.0.0` |
| Flutter app | `mobile_app/pubspec.yaml`, version `1.0.8+11` |
| Prisma migrations | 68 migration SQL files |
| GitHub Actions workflows | 22 `.yml` workflow files |
| API prefix | `/api/v1` |
| Health endpoint | `/api/v1/health` |
| Firebase project in Flutter options | `rentitease-65e49` |
| PostgreSQL provider | Prisma datasource `postgresql`, URL from `DATABASE_URL` |
| Existing API deployment config | `backend/railway.json` |
| Existing web deployment config | `wrangler.jsonc`, Worker name `rentitease` |

The GitHub repository metadata reports default branch `main`. The open-PR queries returned no open PRs at audit time.

### Primary source files inspected

- `backend/package.json`
- `backend/prisma/schema.prisma`
- `backend/railway.json`
- `backend/.env.example`
- `backend/src/app.module.ts`
- `backend/src/main.ts`
- `backend/src/firebase/firebase.module.ts`
- `backend/src/firebase/firebase.service.ts`
- `backend/src/storage/storage.module.ts`
- `backend/src/storage/storage.service.ts`
- `backend/src/modules/auth/auth.controller.ts`
- `backend/src/modules/auth/auth.service.ts`
- `backend/src/modules/auth/strategies/jwt.strategy.ts`
- `backend/src/modules/push-notifications/push-notifications.service.ts`
- `backend/src/modules/notifications/notifications.service.ts`
- `backend/src/modules/uploads/uploads.service.ts`
- `backend/src/database/prisma.service.ts`
- `backend/src/database/database.module.ts`
- `backend/src/prisma/prisma.service.ts`
- `backend/src/prisma/prisma.module.ts`
- `mobile_app/pubspec.yaml`
- `mobile_app/lib/firebase_options.dart`
- `mobile_app/lib/main.dart`
- `mobile_app/lib/core/network/api_client.dart`
- `mobile_app/lib/features/authentication/data/services/google_auth_service.dart`
- `mobile_app/lib/features/authentication/services/authentication_service.dart`
- `mobile_app/lib/features/notifications/services/push_notification_service.dart`
- `mobile_app/lib/core/services/storage_service.dart`
- `wrangler.jsonc`
- `.github/workflows/backend_ci.yml`
- `.github/workflows/cloudflare-web-deploy.yml`
- `.github/workflows/production_release.yml`

## 2. Existing Firebase integration

### Firebase Authentication

Observed flow:

1. Flutter `GoogleAuthService` obtains a Google ID token.
2. Flutter signs in to Firebase Authentication with the Google credential.
3. The app's authentication service posts the Firebase ID token to `POST /api/v1/auth/firebase-login`.
4. NestJS calls `FirebaseService.verifyToken()`, which uses Firebase Admin `verifyIdToken`.
5. The backend maps the verified identity to a PostgreSQL `User` record and issues the application's existing access and refresh JWTs.
6. Protected API requests use the RentItEase JWT bearer token; the Passport JWT strategy resolves the user from PostgreSQL.

**Architecture implication:** Do not silently replace the existing app JWT/refresh-token contract with Firebase bearer tokens during the hosting move. Phase 1 should preserve the existing client/API session contract while tightening and documenting the Firebase identity mapping. A direct Firebase-token-per-request model would be a separate, explicitly tested contract change.

The auth controller/service still contains email OTP, phone OTP, email/password registration and login endpoints. The Flutter release workflow passes `ENABLE_PHONE_OTP=false`, but server endpoints remain in source. The product requirement is Google Sign-In only; later auth work must inventory and safely deprecate unused legacy endpoints without changing the intended Google-only experience or breaking account recovery unexpectedly.

### Firebase Admin SDK

`backend/src/firebase/firebase.service.ts` initializes Firebase Admin using `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL` and `FIREBASE_PRIVATE_KEY`. It exposes:

- Firebase Auth ID-token verification.
- Firebase Storage upload, private upload, signed download URL and delete operations.
- Firebase Messaging single-device and multicast send operations.
- Retry and timeout wrappers for Firebase operations.

`backend/src/app.module.ts` requires the Firebase Admin credentials at startup through Joi environment validation.

### Firebase App Check

Flutter initializes Firebase App Check after the first app frame. Android uses Play Integrity in release builds; web uses reCAPTCHA Enterprise. The Dio API client attempts to attach `X-Firebase-AppCheck`, but treats token acquisition as best effort.

No backend App Check verification guard was identified in the inspected backend source paths. Before enforcing App Check, Phase 2 must perform a repository-wide check, add server-side verification and observability, test debug/staging/release providers, and only then consider enforcement.

### Firebase Cloud Messaging

- Flutter uses `firebase_messaging` to request permission, obtain FCM tokens and listen for token refresh.
- Tokens are registered with `/api/v1/push-notifications/register`.
- The backend persists device tokens in PostgreSQL `UserDevice`.
- Push sends are performed through Firebase Admin Messaging.
- Notification history and read state are stored in PostgreSQL `Notification`.

No transactional outbox worker was found in the inspected notification implementation. A PostgreSQL transactional outbox is recommended before relying on asynchronous delivery for critical booking/payment events.

### Firebase Storage and storage configuration

The current `StorageService` delegates directly to `FirebaseService`:

- Property images/videos use Firebase Storage upload and a returned download URL.
- Private chat attachments are stored in Firebase Storage and served through a participant-checked API endpoint that returns a short-lived signed URL.
- Chat attachment access checks PostgreSQL conversation membership and validates the expected object prefix.

Configuration discrepancy to resolve in a later implementation PR:

- `backend/.env.example` documents `STORAGE_DRIVER=firebase` and calls Firebase Storage the sole authoritative application storage provider.
- `backend/src/app.module.ts` accepts both `firebase` and `r2` and conditionally requires R2 environment variables.
- The inspected `StorageService` is directly wired to `FirebaseService`; no R2 storage adapter was found in the repository path inventory.

Do not change the storage driver or migrate objects in Phase 0. Phase 1/4 should establish the actual deployed configuration, object inventory, URL compatibility, private-file access and rollback before any object migration.

### Firestore

No `cloud_firestore` dependency was found in `mobile_app/pubspec.yaml`, and no Firestore module/adapter was identified in the inspected backend tree. Firestore is therefore not an existing persistence layer in this repository.

**Recommendation:** Do not introduce Firestore as a second source of truth for relational rental, payment or moderation records. Consider it later only for disposable/rebuildable real-time projections where there is a measurable product need.

## 3. PostgreSQL and Prisma

The Prisma schema declares PostgreSQL and obtains its connection from `DATABASE_URL`. The schema includes relational models for users, properties, property images, bookings, leases, invoices, payments, notifications, user devices, chat/conversations, memberships, reviews, visits, social publication, moderation and admin audit.

There are 68 migration SQL files in `backend/prisma/migrations`. Migrations are a production asset and must be preserved; no squash, delete, reset or rewrite is in scope.

### High-priority finding: duplicate Prisma service/module implementations

Two global Prisma modules/services exist:

- `src/database/database.module.ts` provides `src/database/prisma.service.ts`.
- `src/prisma/prisma.module.ts` provides `src/prisma/prisma.service.ts`.

Both modules are imported by `AppModule`. The auth service imports the Prisma service from `src/prisma`, while the JWT strategy and several other modules import the service from `src/database`.

These are separate PrismaClient subclasses and can create separate pools/connections. This is a maintainability and connection-budget risk, especially with Cloud Run autoscaling. Confirm injection graph and tests, then consolidate to one shared provider in a dedicated follow-up PR. Do not combine that refactor with the documentation-only Phase 0 PR.

### Database ownership decision

PostgreSQL remains authoritative for all transactional and relational business records. No production data migration to Firestore is planned. Cloud Run will connect to the existing Neon PostgreSQL endpoint using TLS and the approved pooled connection configuration, subject to region/latency and connection-limit verification.

## 4. Hosting and delivery inventory

### Existing API — Railway

`backend/railway.json` defines:

- Pre-deploy: a legacy migration-resolution command followed by `npx prisma migrate deploy`.
- Start command: `node dist/main`.
- Health check: `/api/v1/health`.

The repository configuration does not prove the current Railway project/service branch binding, auto-deploy toggle, production variable values or latest deployment health. Those must be verified in the Railway console before cutover.

### Existing web — Cloudflare

`wrangler.jsonc` configures Worker `rentitease`, with static assets from `mobile_app/build/web` and SPA fallback. `.github/workflows/cloudflare-web-deploy.yml` builds Flutter web, validates the Wrangler asset directory and deploys the Worker on main pushes affecting web/Worker paths.

Keep Cloudflare DNS/domain and Flutter web delivery unchanged during the API-host migration. Cloud Run can be routed behind the existing API domain only after staging and production cutover checks.

### Cloud Run readiness

No dedicated `backend/Dockerfile`, Cloud Run service manifest or Cloud Run deployment workflow was identified in the audited tree. The Cloud Run implementation therefore remains future work: container build, Artifact Registry, deploy workflow, service identity/IAM, Secret Manager bindings, health/readiness probes, scaling/concurrency limits, database pool budgeting, logs/metrics/alerts and rollback revision strategy.

## 5. GitHub Actions baseline on the frozen main commit

The following push-triggered workflows were observed for `71e66ae`:

| Workflow | Result |
|---|---|
| Flutter Fast Check | Success |
| Dependency and Security Audit | Success |
| Backend CI | Success |
| RentItEase Cloudflare Web Deploy | Success |
| CI/CD Configuration Audit | Success |
| iOS Build | Success |
| RentItEase - Release E2E / RC1 | **Failure** |

The existing Release E2E / RC1 run reported 118 passing tests and 2 failing marketplace browsing tests. The failures were for `SITE_RENT` and `SITE_LEASE`; the remote API response still listed only `RENT, LEASE, SALE, SITE_SALE` as accepted transaction types. This is consistent with an API deployment/schema rollout lag after PR #103 and needs separate production deployment verification.

**Safety note:** This audit did not initiate a production database test, mutation, migration or deployment. The pre-existing push-triggered remote Release E2E workflow did run after the main merge. Before future release testing, inspect and isolate this workflow so any mutating E2E fixtures run only against the isolated Neon staging branch and staging API. Do not manually run the production E2E workflow as part of this migration.

## 6. Risks and required follow-up

| Priority | Finding / risk | Required follow-up |
|---|---|---|
| P0 | Existing RC1 remote E2E failed on new marketplace enum values | Verify production deployment/migration separately; isolate E2E before rerun |
| P1 | Duplicate global Prisma services may create multiple connection pools | Consolidate in a dedicated tested PR before Cloud Run autoscaling |
| P1 | App Check is sent best-effort by client; backend enforcement not located | Repository-wide audit, verifier, telemetry and staged enforcement |
| P1 | Google/Firebase identity is exchanged for custom JWT session | Preserve contract initially; test UID mapping, account linking and revocation |
| P1 | OTP/password endpoints remain in backend source despite Google-only product requirement | Inventory callers and safely deprecate unused routes in a separate auth PR |
| P1 | Storage driver schema accepts R2 but current service is Firebase-backed | Establish actual production setting and choose one tested adapter contract |
| P1 | Cloud Run deployment assets are not present | Add container, CI/CD, IAM, secrets, health and rollback configuration in later PR |
| P2 | Push send path has no identified transactional outbox | Add durable event delivery, retries, idempotency and dead-letter/alert handling |
| P2 | No current Firestore persistence integration identified | Keep Firestore optional and projection-only until justified |

## 7. Phase 0 acceptance checklist

- [x] Freeze and record the exact `main` SHA.
- [x] Inventory Firebase client and Admin SDK integration.
- [x] Inventory auth/session flow, FCM, Storage and App Check.
- [x] Inventory Prisma/PostgreSQL schema and migration count.
- [x] Inventory Railway and Cloudflare deployment configuration.
- [x] Inventory GitHub Actions workflows and main baseline results.
- [x] Record risks, dependencies and safe migration order.
- [x] Confirm no production database or deployment changes were made by this audit.
- [ ] Obtain review/approval of the architecture and findings.
- [ ] Begin Phase 1 only in a separate implementation PR.

## 8. Explicit exclusions

This Phase 0 PR is documentation only. It must not:

- Change application behavior, auth routes, JWT/session behavior or user roles.
- Add Firebase/Google Cloud dependencies or runtime configuration.
- Change Prisma schema or any migration file.
- Read, write, seed, migrate, reset or run E2E tests against production PostgreSQL.
- Change Railway/Cloudflare/Firebase production settings or deploy services.
- Move files or objects to Firebase Storage or Firestore.
- Remove Railway or change the production API domain.
