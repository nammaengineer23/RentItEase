-- Durable push notification outbox and per-device delivery ledger.
CREATE TABLE "NotificationOutbox" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "notificationId" TEXT,
  "idempotencyKey" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "data" JSONB,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "attemptCount" INTEGER NOT NULL DEFAULT 0,
  "maxAttempts" INTEGER NOT NULL DEFAULT 8,
  "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lockedAt" TIMESTAMP(3),
  "lockToken" TEXT,
  "lastError" TEXT,
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "NotificationOutbox_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "NotificationOutboxDelivery" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "deviceId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "attemptCount" INTEGER NOT NULL DEFAULT 0,
  "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastError" TEXT,
  "sentAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "NotificationOutboxDelivery_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "NotificationOutbox_notificationId_key" ON "NotificationOutbox"("notificationId");
CREATE UNIQUE INDEX "NotificationOutbox_idempotencyKey_key" ON "NotificationOutbox"("idempotencyKey");
CREATE INDEX "NotificationOutbox_status_availableAt_createdAt_idx" ON "NotificationOutbox"("status", "availableAt", "createdAt");
CREATE INDEX "NotificationOutbox_lockedAt_idx" ON "NotificationOutbox"("lockedAt");
CREATE INDEX "NotificationOutbox_userId_createdAt_idx" ON "NotificationOutbox"("userId", "createdAt");
CREATE UNIQUE INDEX "NotificationOutboxDelivery_eventId_deviceId_key" ON "NotificationOutboxDelivery"("eventId", "deviceId");
CREATE INDEX "NotificationOutboxDelivery_eventId_status_nextAttemptAt_idx" ON "NotificationOutboxDelivery"("eventId", "status", "nextAttemptAt");
ALTER TABLE "NotificationOutbox" ADD CONSTRAINT "NotificationOutbox_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NotificationOutbox" ADD CONSTRAINT "NotificationOutbox_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "Notification"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NotificationOutboxDelivery" ADD CONSTRAINT "NotificationOutboxDelivery_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "NotificationOutbox"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NotificationOutboxDelivery" ADD CONSTRAINT "NotificationOutboxDelivery_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "UserDevice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
