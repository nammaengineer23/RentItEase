-- Owner consent is a single general permission. Administrators choose the
-- platform for each publication and no automatic publishing is permitted.
ALTER TABLE "SocialMarketingConsent"
  DROP COLUMN IF EXISTS "autoPublish",
  DROP COLUMN IF EXISTS "platforms";

DROP INDEX IF EXISTS "SocialMarketingConsent_autoPublish_idx";

ALTER TABLE "SocialMediaPost"
  ADD COLUMN IF NOT EXISTS "scheduledAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "nextRetryAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "attemptCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "maxAttempts" INTEGER NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS "lastAttemptAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "SocialMediaPost_status_scheduledAt_idx"
  ON "SocialMediaPost"("status", "scheduledAt");
CREATE INDEX IF NOT EXISTS "SocialMediaPost_status_nextRetryAt_idx"
  ON "SocialMediaPost"("status", "nextRetryAt");

CREATE TABLE IF NOT EXISTS "SocialMediaAuditEvent" (
  "id" TEXT NOT NULL,
  "postId" TEXT,
  "propertyId" TEXT NOT NULL,
  "actorId" TEXT,
  "eventType" TEXT NOT NULL,
  "details" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SocialMediaAuditEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "SocialMediaAuditEvent_propertyId_createdAt_idx"
  ON "SocialMediaAuditEvent"("propertyId", "createdAt");
CREATE INDEX IF NOT EXISTS "SocialMediaAuditEvent_postId_createdAt_idx"
  ON "SocialMediaAuditEvent"("postId", "createdAt");

CREATE TABLE IF NOT EXISTS "SocialMediaSetting" (
  "key" TEXT NOT NULL,
  "value" JSONB NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SocialMediaSetting_pkey" PRIMARY KEY ("key")
);

-- The pre-existing snapshot table used a campaign identifier even though
-- publishing is tracked by SocialMediaPost. Align analytics with the post.
ALTER TABLE "SocialAnalyticsSnapshot" RENAME COLUMN "campaignId" TO "postId";
DROP INDEX IF EXISTS "SocialAnalyticsSnapshot_campaignId_idx";
CREATE INDEX IF NOT EXISTS "SocialAnalyticsSnapshot_postId_idx"
  ON "SocialAnalyticsSnapshot"("postId");
ALTER TABLE "SocialAnalyticsSnapshot"
  ADD CONSTRAINT "SocialAnalyticsSnapshot_postId_fkey"
  FOREIGN KEY ("postId") REFERENCES "SocialMediaPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
