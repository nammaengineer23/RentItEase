-- Rotate the refresh-token schema. Existing refresh tokens are intentionally invalidated
-- because the new rotation/reuse-detection model requires a JTI and token family.
DELETE FROM "RefreshToken";

ALTER TABLE "RefreshToken"
  ADD COLUMN "jti" TEXT NOT NULL,
  ADD COLUMN "familyId" TEXT NOT NULL,
  ADD COLUMN "usedAt" TIMESTAMP(3),
  ADD COLUMN "revokedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "RefreshToken_jti_key" ON "RefreshToken"("jti");
CREATE INDEX "RefreshToken_userId_familyId_idx" ON "RefreshToken"("userId", "familyId");
CREATE INDEX "RefreshToken_familyId_idx" ON "RefreshToken"("familyId");
CREATE INDEX "RefreshToken_expiresAt_idx" ON "RefreshToken"("expiresAt");
