ALTER TABLE "Booking" ADD COLUMN "activePropertyKey" TEXT;

CREATE UNIQUE INDEX "Booking_activePropertyKey_key" ON "Booking"("activePropertyKey");
