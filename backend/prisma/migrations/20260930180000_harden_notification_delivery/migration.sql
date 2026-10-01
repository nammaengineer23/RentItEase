-- Add notification deduplication and durable push delivery queue
-- This migration is defensive so a previously interrupted production attempt
-- can be safely retried after Prisma marks the failed migration rolled back.

DO $reconcile$
BEGIN
  IF to_regclass('"UserDevice"') IS NULL
     AND to_regclass('"DeviceToken"') IS NOT NULL THEN
    ALTER TABLE "DeviceToken" RENAME TO "UserDevice";
  END IF;
END
$reconcile$;

DO $normalize$
BEGIN
  IF to_regclass('"UserDevice"') IS NOT NULL THEN
    ALTER TABLE "UserDevice"
      ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
    ALTER TABLE "UserDevice"
      ALTER COLUMN "platform" DROP NOT NULL;
  END IF;
END
$normalize$;

ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "dedupeKey" TEXT;
UPDATE "Notification"
SET "dedupeKey" = md5("id")
WHERE "dedupeKey" IS NULL;
ALTER TABLE "Notification" ALTER COLUMN "dedupeKey" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "Notification_dedupeKey_key"
  ON "Notification"("dedupeKey");
CREATE INDEX IF NOT EXISTS "Notification_userId_createdAt_idx"
  ON "Notification"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "Notification_userId_isRead_createdAt_idx"
  ON "Notification"("userId", "isRead", "createdAt");

DO $enum$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'NotificationDeliveryStatus'
      AND typnamespace = current_schema()::regnamespace
  ) THEN
    CREATE TYPE "NotificationDeliveryStatus" AS ENUM ('PENDING', 'PROCESSING', 'SENT', 'FAILED');
  END IF;
END
$enum$;

CREATE TABLE IF NOT EXISTS "NotificationDelivery" (
  "id" TEXT NOT NULL,
  "notificationId" TEXT NOT NULL,
  "deviceId" TEXT NOT NULL,
  "status" "NotificationDeliveryStatus" NOT NULL DEFAULT 'PENDING',
  "processingAt" TIMESTAMP(3),
  "attemptCount" INTEGER NOT NULL DEFAULT 0,
  "nextRetryAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastError" TEXT,
  "sentAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "NotificationDelivery_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "NotificationDelivery"
  ADD COLUMN IF NOT EXISTS "notificationId" TEXT;
ALTER TABLE "NotificationDelivery"
  ADD COLUMN IF NOT EXISTS "deviceId" TEXT;
ALTER TABLE "NotificationDelivery"
  ADD COLUMN IF NOT EXISTS "status" "NotificationDeliveryStatus" NOT NULL DEFAULT 'PENDING';
ALTER TABLE "NotificationDelivery"
  ADD COLUMN IF NOT EXISTS "processingAt" TIMESTAMP(3);
ALTER TABLE "NotificationDelivery"
  ADD COLUMN IF NOT EXISTS "attemptCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "NotificationDelivery"
  ADD COLUMN IF NOT EXISTS "nextRetryAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "NotificationDelivery"
  ADD COLUMN IF NOT EXISTS "lastError" TEXT;
ALTER TABLE "NotificationDelivery"
  ADD COLUMN IF NOT EXISTS "sentAt" TIMESTAMP(3);
ALTER TABLE "NotificationDelivery"
  ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "NotificationDelivery"
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE UNIQUE INDEX IF NOT EXISTS "NotificationDelivery_notificationId_deviceId_key"
  ON "NotificationDelivery"("notificationId", "deviceId");
CREATE INDEX IF NOT EXISTS "NotificationDelivery_status_nextRetryAt_idx"
  ON "NotificationDelivery"("status", "nextRetryAt");
CREATE INDEX IF NOT EXISTS "NotificationDelivery_deviceId_status_idx"
  ON "NotificationDelivery"("deviceId", "status");

DO $fk$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'NotificationDelivery_notificationId_fkey'
      AND conrelid = '"NotificationDelivery"'::regclass
  ) THEN
    ALTER TABLE "NotificationDelivery"
      ADD CONSTRAINT "NotificationDelivery_notificationId_fkey"
      FOREIGN KEY ("notificationId") REFERENCES "Notification"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'NotificationDelivery_deviceId_fkey'
      AND conrelid = '"NotificationDelivery"'::regclass
  ) THEN
    ALTER TABLE "NotificationDelivery"
      ADD CONSTRAINT "NotificationDelivery_deviceId_fkey"
      FOREIGN KEY ("deviceId") REFERENCES "UserDevice"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$fk$;
