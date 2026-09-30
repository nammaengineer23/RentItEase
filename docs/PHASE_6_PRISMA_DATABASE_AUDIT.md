# PHASE 6 — Prisma / Database Audit

## Scope

This audit reconciles `backend/prisma/schema.prisma`, the complete Prisma migration history, database-level race protections, query indexes, and CI migration verification.

The repository currently contains **65 ordered migrations**, ending at `20260930183500_add_invoice_query_index`.

## 6.1 Constraints

### Foreign keys

Prisma relation fields are backed by PostgreSQL foreign keys. Required ownership/resource relations use explicit `onDelete` behavior where destructive cascading is intentional.

Important patterns:
- user-owned operational data generally cascades when a user is removed;
- property-owned operational data generally cascades when a property is removed;
- invoices use `SetNull` for optional payment/membership references;
- payment refunds cascade from their payment;
- join tables cascade from both sides.

Prisma validation remains a required CI gate.

### Unique constraints

Database uniqueness is present for:
- user email / phone / Firebase UID;
- favorite `(userId, propertyId)`;
- review `(userId, propertyId)`;
- device token;
- refresh-token JTI and token;
- OTP challenge `(target, purpose)`;
- booking visit;
- booking active-property reservation key;
- payment booking ID;
- Razorpay order/payment IDs;
- payment order-creation token;
- payment refund active key / Razorpay refund ID;
- invoice number and payment ID;
- membership Razorpay order/payment IDs;
- social account `(platform, accountId)`;
- conversation `(propertyId, ownerId, tenantId)`;
- property/amenity join key.

### Required vs optional / enums

`prisma validate` is run in CI. Monetary fields use Decimal types and the existing Phase 5 rules remain authoritative.

### Cascade / restrict / soft delete

The schema uses explicit cascades where the application treats child data as dependent on a parent. Optional invoice references use SetNull.

Soft-delete semantics are **not global**:
- chat messages have `deletedAt`;
- users use `isActive`;
- several business resources intentionally use status enums and/or hard deletion with cascades.

This is documented behavior rather than an assumed universal soft-delete contract.

## 6.2 Race-condition constraints

Verified database-level protections:
- **one payment per booking:** unique `Payment.bookingId`;
- **favorite uniqueness:** unique `(userId, propertyId)`;
- **review uniqueness:** unique `(userId, propertyId)`;
- **device uniqueness:** unique device token;
- **refresh-token uniqueness:** unique JTI and token;
- **OTP lifecycle:** unique active challenge per target/purpose;
- **invoice uniqueness:** unique payment ID;
- **booking conflict protection:** unique active-property key.

Membership active-state exclusivity is additionally protected by serializable transactions in the membership service. Historical memberships must remain possible, so a simple `(userId,status)` unique constraint would be incorrect; the application transaction is therefore retained rather than over-constraining history.

## 6.3 Indexes

Phase 6 adds/strengthens indexes for:
- user role + creation time;
- property owner and location filtering;
- booking property/tenant + status;
- invoice user/status/date;
- membership user/status;
- lease tenant/status;
- payment status + creation time;
- notification user/read/creation time;
- conversation property/owner/tenant + update time;
- message conversation + creation time;
- visit property/tenant + visit date;
- premium listing user/status.

Existing indexes for webhook events, refunds, refresh tokens, OTP challenges, reviews, social media jobs, and other operational queries remain in place.

## 6.4 Migration safety

### Ordering

Migration directories are required to:
1. use the timestamped naming convention;
2. sort strictly lexicographically;
3. contain exactly a `migration.sql`.

The audit currently reports 65 ordered migrations.

### Destructive migrations

Destructive SQL is reviewed by CI. The two known data-destructive migrations are explicit and allowlisted:

- `20260929210000_harden_refresh_token_rotation` deletes existing refresh tokens because the rotation model changes their required identity/family contract.
- `20260929223000_harden_auth_otp_challenges` removes older duplicate OTP challenges before enforcing the new uniqueness rule.

Any new DROP/TRUNCATE/DELETE migration outside the reviewed allowlist fails the audit.

### Fresh database creation

CI now creates a clean PostgreSQL 16 database and runs the entire migration history with:

`npx prisma migrate deploy`

It then runs `prisma migrate status` and a live-database-to-schema `prisma migrate diff --exit-code`.

### Existing-data compatibility

After the complete migration history is applied, CI inserts representative user and membership-plan rows and re-checks migration status. This is a compatibility smoke test; it is not a copy of production data.

### Production ordering

Production must apply migrations in repository order using `prisma migrate deploy`. The backend production start command currently performs this before starting the application, so a release must not be considered healthy until the migration command succeeds.

### Rollback / recovery

Prisma migrations are forward-only application changes; `git revert` is not a database rollback.

For a failed migration, the recovery process is:
1. stop/hold the affected deployment;
2. inspect the failed migration and database state;
3. use `prisma migrate diff` to generate a corrective SQL change where required;
4. apply the corrective SQL with controlled database tooling;
5. use `prisma migrate resolve` only to reconcile the migration ledger after the database state is corrected;
6. deploy the corrected application/migration sequence.

The existing `docs/PRODUCTION_ROLLBACK.md` remains the operational rollback reference.

## CI gate

Phase 6 cannot close until:
- Prisma validation passes;
- the static database audit passes;
- all 65 migrations apply successfully to a fresh PostgreSQL database;
- migration status reports no drift/failed migrations;
- live database and Prisma schema diff cleanly;
- existing unit/security tests remain green;
- all relevant GitHub Actions for the resulting head commit pass.

No phase-complete status should be recorded before those gates pass.
