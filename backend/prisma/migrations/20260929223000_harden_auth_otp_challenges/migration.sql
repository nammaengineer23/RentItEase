-- Harden AuthOtpChallenge for one-time consumption, resend throttling,
-- and a single active challenge per target/purpose.
ALTER TABLE "AuthOtpChallenge"
  ADD COLUMN "consumedAt" TIMESTAMP(3),
  ADD COLUMN "proofUsedAt" TIMESTAMP(3),
  ADD COLUMN "lastSentAt" TIMESTAMP(3),
  ADD COLUMN "windowStartedAt" TIMESTAMP(3),
  ADD COLUMN "requestCount" INTEGER NOT NULL DEFAULT 0;

-- Keep the newest challenge before adding the composite uniqueness constraint.
DELETE FROM "AuthOtpChallenge" older
WHERE EXISTS (
  SELECT 1
  FROM "AuthOtpChallenge" newer
  WHERE newer."target" = older."target"
    AND newer."purpose" = older."purpose"
    AND (
      newer."createdAt" > older."createdAt"
      OR (newer."createdAt" = older."createdAt" AND newer."id" > older."id")
    )
);

CREATE UNIQUE INDEX "AuthOtpChallenge_target_purpose_key"
  ON "AuthOtpChallenge"("target", "purpose");

CREATE INDEX "AuthOtpChallenge_lastSentAt_idx"
  ON "AuthOtpChallenge"("lastSentAt");
