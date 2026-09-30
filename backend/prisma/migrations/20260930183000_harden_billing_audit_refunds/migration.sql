ALTER TABLE "Payment"
  ADD COLUMN "refundedAt" TIMESTAMP(3),
  ADD COLUMN "refundAmount" DECIMAL(10,2),
  ADD COLUMN "refundId" TEXT;
CREATE UNIQUE INDEX "Payment_refundId_key" ON "Payment"("refundId");

CREATE TABLE "BillingAuditEvent" (
  "id" TEXT NOT NULL,
  "actorId" TEXT,
  "membershipId" TEXT,
  "paymentId" TEXT,
  "action" TEXT NOT NULL,
  "details" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BillingAuditEvent_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "BillingAuditEvent_membershipId_createdAt_idx" ON "BillingAuditEvent"("membershipId","createdAt");
CREATE INDEX "BillingAuditEvent_paymentId_createdAt_idx" ON "BillingAuditEvent"("paymentId","createdAt");
CREATE INDEX "BillingAuditEvent_actorId_createdAt_idx" ON "BillingAuditEvent"("actorId","createdAt");
CREATE INDEX "BillingAuditEvent_createdAt_idx" ON "BillingAuditEvent"("createdAt");

ALTER TABLE "BillingAuditEvent" ADD CONSTRAINT "BillingAuditEvent_actorId_fkey"
FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "BillingAuditEvent" ADD CONSTRAINT "BillingAuditEvent_membershipId_fkey"
FOREIGN KEY ("membershipId") REFERENCES "Membership"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "BillingAuditEvent" ADD CONSTRAINT "BillingAuditEvent_paymentId_fkey"
FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
