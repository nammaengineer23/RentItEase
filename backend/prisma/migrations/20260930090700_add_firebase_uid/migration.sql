-- Phase 1A: persist the verified Firebase identity on the application user.
ALTER TABLE "User" ADD COLUMN "firebaseUid" TEXT;

CREATE UNIQUE INDEX "User_firebaseUid_key" ON "User"("firebaseUid");
