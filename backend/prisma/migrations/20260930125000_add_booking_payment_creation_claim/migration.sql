ALTER TABLE "Booking" ADD COLUMN "paymentOrderCreationKey" TEXT;
ALTER TABLE "Booking" ADD COLUMN "paymentOrderCreationStartedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "Booking_paymentOrderCreationKey_key" ON "Booking"("paymentOrderCreationKey");
