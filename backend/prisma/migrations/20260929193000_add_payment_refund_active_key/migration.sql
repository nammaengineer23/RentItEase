ALTER TABLE "PaymentRefund" ADD COLUMN "activeKey" TEXT;

CREATE UNIQUE INDEX "PaymentRefund_activeKey_key"
ON "PaymentRefund"("activeKey");
