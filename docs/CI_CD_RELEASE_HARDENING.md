# CI/CD and Release Hardening

## Scope

Phase 1 hardens the RentItEase delivery path without modifying `main`. All changes are applied to `codex/otp-verification-hardening` / PR #85.

## Canonical toolchain

- Flutter: 3.44.8 stable.
- Android Java: Temurin 17.
- Backend Node.js: 24.
- Admin/Web Node.js: 22.
- Prisma: validated and generated during backend CI.

Every workflow that builds Flutter must use the same Flutter SDK version.

## Authoritative CI gates

### Backend

Backend CI runs, in order:

1. `npm ci`
2. `npx prisma validate`
3. `npx prisma generate`
4. `npm run lint`
5. `npm run build`
6. `npm test -- --runInBand`
7. `npm run test:unit:properties`

Production E2E remains a separate release gate because it uses live production accounts and data.

### Admin

Admin CI runs:

1. `npm ci`
2. `npm run lint`
3. `npm run build`
4. Verify `dist/index.html` exists.

### Flutter

Flutter CI remains responsible for:

- `flutter pub get`
- `flutter analyze`
- Flutter unit/widget tests
- integration smoke test
- debug APK
- release APK
- release AAB

Release E2E additionally validates Flutter Web.

## Web artifact contract

The production web deployment workflow is the single producer and consumer of the production web artifact:

`mobile_app/build/web/**`

It:

1. checks out the exact tested commit;
2. builds the admin panel into `admin_panel/dist`;
3. builds Flutter Web into `mobile_app/build/web`;
4. copies the admin panel into `mobile_app/build/web/admin-panel`;
5. verifies `mobile_app/build/web/index.html`;
6. deploys that directory using `wrangler.jsonc`.

The Android release APK is not part of the web deployment contract.

## Migration execution model

The backend package exposes `prisma:deploy` for an explicit migration operation and `start:prod` currently invokes `prisma migrate deploy` before starting the server.

Phase 1 does not rewrite or squash the existing migration history. Before changing production execution to a separate migration job, the deployment platform must be verified and the migration job must use the same release SHA and production database.

Required production procedure:

1. Build and validate the release.
2. Validate Prisma schema.
3. Execute `prisma migrate deploy` exactly once against the target database.
4. Start the application.
5. Verify health.
6. Run release smoke/E2E checks.

Do not use `prisma migrate dev` in production.

## Production environment

The Cloudflare web deployment job references the GitHub `production` environment. Repository administrators must configure that environment with:

- required reviewers, where desired;
- deployment branch/tag restrictions;
- production-only secrets;
- no access from untrusted PR workflows.

The workflow file alone cannot create or verify those repository-level environment rules.

## Permissions and concurrency

CI workflows use read-only `contents` permissions unless a release publisher needs write access. Superseded backend, Flutter, and admin CI runs are cancelled to reduce stale concurrent builds.

Production web deployment remains serialized and cannot be run concurrently with another production web deployment.

## Secret handling

Secrets must come from GitHub Secrets, GitHub Environment Secrets, or the deployment platform. CI must never print secret values.

The security audit checks for:

- hard-coded JWT/Razorpay/Firebase secrets;
- private-key material;
- wildcard CORS;
- tracked database dumps;
- tracked environment files.

If a credential was ever committed, removing the file is not sufficient: rotate the credential.

## Rollback

See [PRODUCTION_ROLLBACK.md](./PRODUCTION_ROLLBACK.md).
