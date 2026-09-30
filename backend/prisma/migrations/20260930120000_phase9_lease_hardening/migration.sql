-- Phase 9: lease lifecycle hardening
ALTER TABLE "Invoice"
  ADD COLUMN "leaseId" TEXT;

ALTER TABLE "Lease"
  ADD COLUMN "paymentId" TEXT,
  ADD COLUMN "invoiceId" TEXT,
  ADD COLUMN "expiredAt" TIMESTAMP(3),
  ADD COLUMN "renewedAt" TIMESTAMP(3),
  ADD COLUMN "renewalCount" INTEGER NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX "Lease_paymentId_key" ON "Lease"("paymentId");
CREATE UNIQUE INDEX "Lease_invoiceId_key" ON "Lease"("invoiceId");
CREATE UNIQUE INDEX "Invoice_leaseId_key" ON "Invoice"("leaseId");
CREATE UNIQUE INDEX "Lease_active_property_unique"
  ON "Lease"("propertyId")
  WHERE "status" = 'ACTIVE';

ALTER TABLE "Lease"
  ADD CONSTRAINT "Lease_paymentId_fkey"
  FOREIGN KEY ("paymentId") REFERENCES "Payment"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Lease"
  ADD CONSTRAINT "Lease_invoiceId_fkey"
  FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Invoice"
  ADD CONSTRAINT "Invoice_leaseId_fkey"
  FOREIGN KEY ("leaseId") REFERENCES "Lease"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
