ALTER TABLE "Payment" ADD COLUMN "orderCreationToken" TEXT;
CREATE UNIQUE INDEX "Payment_orderCreationToken_key" ON "Payment"("orderCreationToken");