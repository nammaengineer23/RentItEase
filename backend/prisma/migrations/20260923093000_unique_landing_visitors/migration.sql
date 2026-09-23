ALTER TABLE "LandingVisit" ADD COLUMN "visitorId" TEXT;
ALTER TABLE "LandingVisit" ADD COLUMN "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE UNIQUE INDEX "LandingVisit_visitorId_key" ON "LandingVisit"("visitorId");
CREATE INDEX "LandingVisit_lastSeenAt_idx" ON "LandingVisit"("lastSeenAt");
