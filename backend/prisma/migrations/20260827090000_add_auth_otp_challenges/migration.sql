CREATE TABLE "AuthOtpChallenge" (
    "id" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "otpHash" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthOtpChallenge_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AuthOtpChallenge_target_purpose_idx"
ON "AuthOtpChallenge"("target", "purpose");

CREATE INDEX "AuthOtpChallenge_expiresAt_idx"
ON "AuthOtpChallenge"("expiresAt");
