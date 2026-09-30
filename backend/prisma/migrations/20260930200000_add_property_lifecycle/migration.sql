-- Phase 7: explicit property lifecycle state.
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

ALTER TABLE "Property"
  ADD COLUMN "lifecycleStatus" "PropertyLifecycleStatus" NOT NULL DEFAULT 'DRAFT';

-- Backfill conservatively from the existing verification/availability signals,
-- then refine with active booking/lease records so occupied/booked properties
-- do not become publicly available during the migration.
UPDATE "Property"
SET "lifecycleStatus" = CASE
  WHEN EXISTS (
    SELECT 1
    FROM "Lease" l
    WHERE l."propertyId" = "Property"."id"
      AND l."status" = 'ACTIVE'
  ) THEN 'OCCUPIED'::"PropertyLifecycleStatus"
  WHEN EXISTS (
    SELECT 1
    FROM "Booking" b
    WHERE b."propertyId" = "Property"."id"
      AND b."status" IN ('PENDING', 'APPROVED', 'PAYMENT_PENDING', 'PAID')
  ) THEN 'BOOKED'::"PropertyLifecycleStatus"
  WHEN "Property"."isVerified" = true AND "Property"."isAvailable" = true
    THEN 'PUBLISHED'::"PropertyLifecycleStatus"
  WHEN "Property"."isVerified" = true
    THEN 'UNAVAILABLE'::"PropertyLifecycleStatus"
  ELSE 'DRAFT'::"PropertyLifecycleStatus"
END;

CREATE INDEX "Property_lifecycleStatus_createdAt_idx"
  ON "Property" ("lifecycleStatus", "createdAt");

CREATE INDEX "Property_lifecycleStatus_city_createdAt_idx"
  ON "Property" ("lifecycleStatus", "city", "createdAt");

CREATE INDEX "Property_latitude_longitude_idx"
  ON "Property" ("latitude", "longitude");
