CREATE TABLE "LandingVisit" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LandingVisit_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "LandingVisit_createdAt_idx" ON "LandingVisit"("createdAt");
