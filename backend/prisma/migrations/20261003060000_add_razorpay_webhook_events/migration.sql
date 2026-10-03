CREATE TABLE "RazorpayWebhookEvent" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "processedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RazorpayWebhookEvent_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "RazorpayWebhookEvent_eventId_key" ON "RazorpayWebhookEvent"("eventId");
CREATE INDEX "RazorpayWebhookEvent_eventType_createdAt_idx" ON "RazorpayWebhookEvent"("eventType", "createdAt");
