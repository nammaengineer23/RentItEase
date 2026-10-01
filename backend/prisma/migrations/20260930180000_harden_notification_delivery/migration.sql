-- Add notification deduplication and durable push delivery queue
ALTER TABLE "Notification" ADD COLUMN "dedupeKey" TEXT;
UPDATE "Notification"
SET "dedupeKey" = md5("id")
WHERE "dedupeKey" IS NULL;
ALTER TABLE "Notification" ALTER COLUMN "dedupeKey" SET NOT NULL;
CREATE UNIQUE INDEX "Notification_dedupeKey_key" ON "Notification"("dedupeKey");
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");
CREATE INDEX "Notification_userId_isRead_createdAt_idx" ON "Notification"("userId", "isRead", "createdAt");

CREATE TYPE "NotificationDeliveryStatus" AS ENUM ('PENDING', 'PROCESSING', 'SENT', 'FAILED');

CREATE TABLE "NotificationDelivery" (
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

CREATE UNIQUE INDEX "NotificationDelivery_notificationId_deviceId_key"
  ON "NotificationDelivery"("notificationId", "deviceId");
CREATE INDEX "NotificationDelivery_status_nextRetryAt_idx"
  ON "NotificationDelivery"("status", "nextRetryAt");
CREATE INDEX "NotificationDelivery_deviceId_status_idx"
  ON "NotificationDelivery"("deviceId", "status");

ALTER TABLE "NotificationDelivery"
  ADD CONSTRAINT "NotificationDelivery_notificationId_fkey"
  FOREIGN KEY ("notificationId") REFERENCES "Notification"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NotificationDelivery"
  ADD CONSTRAINT "NotificationDelivery_deviceId_fkey"
  FOREIGN KEY ("deviceId") REFERENCES "DeviceToken"("id") ON DELETE CASCADE ON UPDATE CASCADE;
