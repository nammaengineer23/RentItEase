ALTER TABLE "Property"
ADD COLUMN "dailyRentEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "dailyRent" DECIMAL(10,2);

ALTER TABLE "Property"
ADD CONSTRAINT "Property_dailyRent_enabled_check"
CHECK (NOT "dailyRentEnabled" OR ("dailyRent" IS NOT NULL AND "dailyRent" > 0));

CREATE INDEX "Property_dailyRentEnabled_idx" ON "Property"("dailyRentEnabled");
