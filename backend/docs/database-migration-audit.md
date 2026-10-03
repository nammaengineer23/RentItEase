# RentItEase database migration final audit

## Controls

- Fresh database: CI starts an empty PostgreSQL 16 database and runs the complete committed migration chain with `prisma migrate deploy`.
- Production-like migration: the same disposable database is used as a clean deployment target; migration status and drift are checked after deployment.
- Migration status: `prisma migrate status` must complete without pending or failed migrations.
- Schema drift: `prisma migrate diff --from-schema-datasource ... --to-migrations ... --exit-code` must report no differences.
- Schema/migration parity: the committed migration chain is compared with `schema.prisma`.
- Ordering: timestamped migration directories are applied by Prisma; a fresh deploy exercises the complete chain in order.
- Destructive changes: the audit script scans migration SQL for DROP TABLE, DROP COLUMN, DROP TYPE, DROP INDEX, DROP SCHEMA, DROP DATABASE, and TRUNCATE. Any finding requires explicit review before release.
- Foreign keys: a clean migration must successfully create the declared relations and onDelete behavior.
- Unique constraints: @unique and @@unique declarations are applied by the fresh migration test.
- Composite constraints: composite primary/unique declarations are exercised by the fresh schema deployment.
- Indexes: all @@index declarations are included in the migration/schema parity check.
- Recovery: Prisma migrations are forward-only. There is no automatic rollback command. A failed deployment must stop before application startup, preserve the database for diagnosis, restore from the latest verified backup when data rollback is required, and use a new corrective migration for schema repair.

## Commands

From `backend/`:

`npm run prisma:migrate:audit`

With a disposable database:

`MIGRATION_TEST_DATABASE_URL="postgresql://..." npm run prisma:migrate:fresh:audit`

For production diagnosis only:

`npm run prisma:status`

Do not use `prisma migrate reset` against production. The production deployment path is `prisma migrate deploy`, already enforced by Railway's pre-deploy command.

## Recovery procedure

1. Stop the deployment if migration status or application startup reports a migration failure.
2. Do not manually edit the production `_prisma_migrations` table.
3. Capture the migration name, database error, deployment logs, and current migration status.
4. If the migration partially changed schema, restore the database from the latest verified backup only when data rollback is required and the recovery plan has been reviewed.
5. Otherwise create a new forward-only corrective migration, test it on a fresh database and a production-like copy, then deploy with `prisma migrate deploy`.
6. Re-run migration status, schema-drift verification, backend tests, and health checks before allowing application traffic.

This runbook deliberately treats the database as durable production state: destructive changes require review, and recovery uses backups plus forward corrective migrations rather than an unsafe ad-hoc rollback.