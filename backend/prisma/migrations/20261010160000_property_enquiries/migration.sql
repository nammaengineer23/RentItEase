CREATE TYPE "PropertyEnquiryStatus" AS ENUM ('OPEN', 'CONTACTED', 'CLOSED');

CREATE TABLE "PropertyEnquiry" (
  "id" TEXT NOT NULL,
  "propertyId" TEXT NOT NULL,
  "senderId" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "status" "PropertyEnquiryStatus" NOT NULL DEFAULT 'OPEN',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PropertyEnquiry_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PropertyEnquiry_propertyId_status_createdAt_idx"
  ON "PropertyEnquiry"("propertyId", "status", "createdAt");
CREATE INDEX "PropertyEnquiry_senderId_createdAt_idx"
  ON "PropertyEnquiry"("senderId", "createdAt");

ALTER TABLE "PropertyEnquiry"
  ADD CONSTRAINT "PropertyEnquiry_propertyId_fkey"
  FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PropertyEnquiry"
  ADD CONSTRAINT "PropertyEnquiry_senderId_fkey"
  FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
