# Production Rollback Runbook

## Scope

This runbook covers RentItEase application, web, and database recovery. It is intentionally conservative around Prisma migrations.

## Release identity

Every production deployment must record:

- Git commit SHA;
- application release/version;
- deployment timestamp;
- database migration state;
- health-check result.

Never roll back to an unverified commit.

## Application rollback

### Backend

1. Stop further rollout.
2. Identify the last known-good backend release SHA.
3. Verify that the release is compatible with the current database schema.
4. Redeploy that exact release.
5. Verify `/api/v1/health`.
6. Run a minimal authenticated smoke test.

### Web

1. Identify the last known-good web release/commit.
2. Rebuild or redeploy the exact known-good artifact.
3. Verify the Cloudflare deployment.
4. Verify the public application loads.
5. Verify API connectivity.

Do not rebuild an old deployment from a newer source tree.

### Android

1. Identify the last known-good Play/GitHub release.
2. Do not reuse a mutable artifact from a different commit.
3. If a bad release has already reached users, use the Play release-management process to halt or supersede it according to the rollout state.

## Database rollback

Prisma migrations are forward history. A Git revert does not automatically reverse a database migration.

For every production migration:

- prefer backward-compatible expand/contract changes;
- deploy application code compatible with both old and new schema during transitions;
- avoid destructive changes in the same release as code that still requires the removed data;
- maintain a verified database backup before destructive operations.

If a migration has already changed production data/schema, use the migration-specific recovery procedure or restore from a verified backup. Do not invent a reverse SQL migration during an incident.

## Failed migration

If `prisma migrate deploy` fails:

1. Do not repeatedly restart application instances hoping the migration will recover.
2. Capture the migration name and error.
3. Inspect Prisma migration state.
4. Determine whether the migration completed, partially completed, or did not start.
5. Restore or repair using the approved database recovery procedure.
6. Re-run only after the migration state is understood.

## Production health gate

A deployment is not complete until:

- health endpoint responds successfully;
- database connectivity is healthy;
- critical authentication path is functional;
- web loads successfully;
- release E2E/smoke checks pass where applicable.

## Recovery evidence

After recovery, record:

- incident start/end;
- failed SHA;
- recovered SHA;
- migration state;
- commands/actions performed;
- health-check results;
- follow-up corrective action.

## Backup policy

Database dumps must not be stored in the application repository. Backups belong in an approved private backup system with access control and retention policy.

If a dump has ever contained production data or credentials, treat the repository history as exposed and rotate affected credentials as appropriate.
