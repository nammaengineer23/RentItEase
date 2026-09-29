CREATE TYPE "PaymentWebhookEventStatus" AS ENUM ('RECEIVED', 'PROCESSED', 'IGNORED', 'FAILED');

CREATE TABLE "PaymentWebhookEvent" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "razorpayOrderId" TEXT,
  "razorpayPaymentId" TEXT,
  "status" "PaymentWebhookEventStatus" NOT NULL DEFAULT 'RECEIVED',
  "payload" JSONB NOT NULL,
  "errorMessage" TEXT,
  "processedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "PaymentWebhookEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PaymentWebhookEvent_eventId_key" ON "PaymentWebhookEvent"("eventId");
CREATE INDEX "PaymentWebhookEvent_eventType_createdAt_idx" ON "PaymentWebhookEvent"("eventType", "createdAt");
CREATE INDEX "PaymentWebhookEvent_razorpayOrderId_idx" ON "PaymentWebhookEvent"("razorpayOrderId");
CREATE INDEX "PaymentWebhookEvent_razorpayPaymentId_idx" ON "PaymentWebhookEvent"("razorpayPaymentId");
