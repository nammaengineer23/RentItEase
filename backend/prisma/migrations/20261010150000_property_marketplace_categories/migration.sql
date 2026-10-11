-- Additive marketplace schema foundation. Existing listings remain RENT by default.
CREATE TYPE "PropertyTransactionType" AS ENUM ('RENT', 'LEASE', 'SALE', 'SITE_SALE');
CREATE TYPE "PropertyDocumentReviewStatus" AS ENUM (
  'NOT_SUBMITTED',
  'SUBMITTED',
  'UNDER_REVIEW',
  'VERIFIED',
  'REJECTED'
);

ALTER TABLE "Property"
  ADD COLUMN "transactionType" "PropertyTransactionType" NOT NULL DEFAULT 'RENT',
  ADD COLUMN "askingPrice" DECIMAL(12,2),
  ADD COLUMN "priceNegotiable" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "leaseTermMonths" INTEGER,
  ADD COLUMN "leaseRenewalTerms" TEXT,
  ADD COLUMN "landArea" DOUBLE PRECISION,
  ADD COLUMN "landAreaUnit" TEXT,
  ADD COLUMN "siteFrontage" DOUBLE PRECISION,
  ADD COLUMN "siteFacing" TEXT,
  ADD COLUMN "roadAccess" BOOLEAN,
  ADD COLUMN "zoning" TEXT,
  ADD COLUMN "layoutApprovalDetails" TEXT,
  ADD COLUMN "surveyReference" TEXT,
  ADD COLUMN "documentReviewStatus" "PropertyDocumentReviewStatus" NOT NULL DEFAULT 'NOT_SUBMITTED';

CREATE INDEX "Property_transactionType_isAvailable_createdAt_idx"
  ON "Property"("transactionType", "isAvailable", "createdAt");
CREATE INDEX "Property_transactionType_city_isAvailable_idx"
  ON "Property"("transactionType", "city", "isAvailable");
