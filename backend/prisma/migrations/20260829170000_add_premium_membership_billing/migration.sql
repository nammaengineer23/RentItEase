ALTER TABLE "Membership"
ADD COLUMN "isTrial" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN "razorpayOrderId" TEXT,
ADD COLUMN "razorpayPaymentId" TEXT,
ADD COLUMN "razorpaySignature" TEXT,
ADD COLUMN "paidAt" TIMESTAMP(3);

ALTER TABLE "Invoice" ADD COLUMN "membershipId" TEXT;

CREATE UNIQUE INDEX "Membership_razorpayOrderId_key"
ON "Membership"("razorpayOrderId");

CREATE UNIQUE INDEX "Membership_razorpayPaymentId_key"
ON "Membership"("razorpayPaymentId");

CREATE INDEX "Invoice_membershipId_idx" ON "Invoice"("membershipId");

ALTER TABLE "Invoice"
ADD CONSTRAINT "Invoice_membershipId_fkey"
FOREIGN KEY ("membershipId") REFERENCES "Membership"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

UPDATE "MembershipPlan"
SET "name" = 'Premium 30 Days',
    "description" = 'Premium RentItEase access for 30 days',
    "price" = 99,
    "durationDays" = 30,
    "isActive" = true,
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "code" = 'PREMIUM';
