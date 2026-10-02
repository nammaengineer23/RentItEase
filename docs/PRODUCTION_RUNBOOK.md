# RentItEase Production Runbook

## Required backend configuration
Use the tracked `backend/.env.example` as the inventory. Production must provide database, JWT, Firebase Admin, storage, mail, Razorpay and any enabled provider credentials.

Never place production values in Git, Flutter `--dart-define` values, or the admin bundle unless the value is explicitly public.

## Secret rotation
1. Create replacement secret in the secret manager.
2. Deploy with both old/new compatibility only when the integration requires overlap.
3. Verify health/auth/payment flows.
4. Revoke the old secret.
5. Record rotation date and owner.

## Backend deployment
1. Build with `npm ci`.
2. Generate Prisma client.
3. Run `prisma migrate deploy`.
4. Start the production process.
5. Verify `/api/v1/health`.
6. Verify logs contain request IDs and no credentials.
7. Verify graceful shutdown/restart.

## Web deployment
Build admin first, then Flutter web with the production API URL and public Maps/social configuration. Deploy the combined static site through the Cloudflare workflow.

## Android
Use the signed release workflows. The keystore is injected from GitHub Secrets, never committed. Verify the release signing certificate against Firebase configuration and build an AAB for Play testing.

## iOS
Use the Apple signing environment and verify Firebase bundle registration, App Check provider, permissions, Razorpay integration and production API configuration before App Store distribution.

## Rollback
- Application: redeploy the last known-good commit.
- Database: do not blindly roll migrations backward; use a forward corrective migration or restore procedure.
- Mobile: release a higher build number with the previous known-good application behavior.

## Incident response
1. Identify impact and correlation/request IDs.
2. Stop unsafe automation or publishing workers if needed.
3. Rotate compromised credentials.
4. Preserve relevant audit/payment evidence.
5. Restore service from the last known-good deployment.
6. Reconcile payments and background jobs.
7. Document root cause and corrective action.

## Backup
Production PostgreSQL backup schedules, retention and point-in-time recovery are infrastructure settings and must be verified in the database provider console. Test a restore before declaring the DR gate complete.
