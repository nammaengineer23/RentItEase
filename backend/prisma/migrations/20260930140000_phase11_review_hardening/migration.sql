CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- Phase 11: review hardening
ALTER TABLE "Review"
  ADD COLUMN "status" "ReviewStatus" NOT NULL DEFAULT 'APPROVED';

CREATE INDEX "Review_propertyId_status_createdAt_idx"
  ON "Review" ("propertyId", "status", "createdAt");

CREATE INDEX "Review_propertyId_status_rating_idx"
  ON "Review" ("propertyId", "status", "rating");

CREATE INDEX "Review_userId_createdAt_idx"
  ON "Review" ("userId", "createdAt");
