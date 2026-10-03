# RentItEase production deployment and rollback

## Deployment gates

Production releases are gated by the RentItEase - Release E2E / RC1 workflow on pushes to main.

The release gate verifies backend build/tests, remote production E2E, production health, security configuration, Flutter checks, Flutter web build, and the Android release-candidate build. The RC1 gate succeeds only after those jobs succeed.

The Cloudflare web deployment workflow consumes a successful main RC1 completion and checks out the exact tested commit.

## Railway migration-before-start

backend/railway.json defines:
- preDeployCommand: npx prisma migrate deploy
- startCommand: npm run start:prod
- healthcheckPath: /api/v1/health

The production start command also keeps Prisma migration deployment as a defensive second check.

Never use prisma migrate reset in production and never edit _prisma_migrations manually.

## Health verification

After a production deployment, the release E2E gate waits for the service to stabilize and verifies the production health endpoint before executing release tests. Railway uses the same API health endpoint for its health check.

## Rollback procedure

### Application rollback

1. Stop or pause further releases.
2. In Railway, redeploy the last known-good application deployment/commit.
3. Verify /api/v1/health.
4. Run the release E2E gate against the restored deployment before resuming releases.

### Database rollback

Database changes are forward-only. Do not reset the production database or manually rewrite Prisma migration history.

If an application rollback exposes a schema incompatibility:
1. Keep the database at its current migration level.
2. Restore the compatible application version only when it supports that schema.
3. Create and deploy a corrective forward migration for required schema/data repair.
4. Restore from a verified PostgreSQL backup only when data recovery is actually required and forward migration cannot safely recover it.
5. Re-run migration status and production E2E verification.

### Secret and artifact safety

Production secrets are supplied through Railway/GitHub secret storage. Workflow steps do not intentionally echo secret values.

Release artifact workflows run a protected-secret scan before uploading distributable artifacts. Signing keystores and local environment files are rejected from artifact directories.

## Verification policy

The CI/CD audit workflow checks deployment gates, migration-before-start, health checks, trigger policy and rollback documentation on every relevant workflow/configuration change.
