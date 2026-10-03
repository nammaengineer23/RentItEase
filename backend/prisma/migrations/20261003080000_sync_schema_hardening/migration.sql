-- Synchronize schema changes that were previously present in schema.prisma
-- without a committed migration. The guards make this safe against production
-- databases that already contain part of the repaired schema.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type
    WHERE typname = 'PropertyLifecycleStatus'
  ) THEN
    CREATE TYPE "PropertyLifecycleStatus" AS ENUM (
      'DRAFT',
      'SUBMITTED',
      'VERIFIED',
      'PUBLISHED',
      'BOOKED',
      'OCCUPIED',
      'UNAVAILABLE',
      'ARCHIVED'
    );
  END IF;
END $$;

ALTER TABLE "Booking"
  ADD COLUMN IF NOT EXISTS "activePropertyKey" TEXT,
  ADD COLUMN IF NOT EXISTS "paymentOrderCreationKey" TEXT,
  ADD COLUMN IF NOT EXISTS "paymentOrderCreationStartedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX IF NOT EXISTS "Booking_activePropertyKey_key"
  ON "Booking"("activePropertyKey");

CREATE UNIQUE INDEX IF NOT EXISTS "Booking_paymentOrderCreationKey_key"
  ON "Booking"("paymentOrderCreationKey");

ALTER TABLE "Property"
  ADD COLUMN IF NOT EXISTS "lifecycleStatus" "PropertyLifecycleStatus" NOT NULL DEFAULT 'DRAFT';

-- These legacy MembershipPlan fields are no longer part of the Prisma model.
DROP INDEX IF EXISTS "MembershipPlan_displayOrder_idx";

ALTER TABLE "MembershipPlan"
  DROP COLUMN IF EXISTS "displayOrder",
  DROP COLUMN IF EXISTS "features",
  DROP COLUMN IF EXISTS "trialDays";

-- The attachment metadata remains persisted, but the current Prisma model
-- intentionally does not maintain a standalone attachmentPublicId index.
DROP INDEX IF EXISTS "Message_attachmentPublicId_idx";

-- deletedAt remains part of the User model; its dedicated index is no longer
-- part of the committed Prisma schema.
DROP INDEX IF EXISTS "User_deletedAt_idx";
