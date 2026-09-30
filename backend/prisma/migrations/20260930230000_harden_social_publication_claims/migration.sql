ALTER TABLE "SocialMediaPost"
  ADD COLUMN "idempotencyKey" TEXT,
  ADD COLUMN "processingToken" TEXT,
  ADD COLUMN "processingLeaseUntil" TIMESTAMP(3);

UPDATE "SocialMediaPost"
SET "idempotencyKey" = md5("id" || ':' || "platform")
WHERE "idempotencyKey" IS NULL;

ALTER TABLE "SocialMediaPost"
  ALTER COLUMN "idempotencyKey" SET NOT NULL;

CREATE UNIQUE INDEX "SocialMediaPost_idempotencyKey_key"
  ON "SocialMediaPost"("idempotencyKey");

CREATE INDEX "SocialMediaPost_processingLeaseUntil_idx"
  ON "SocialMediaPost"("processingLeaseUntil");
