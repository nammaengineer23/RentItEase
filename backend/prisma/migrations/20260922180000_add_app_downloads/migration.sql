CREATE TABLE "AppDownload" (
    "id" TEXT NOT NULL,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AppDownload_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AppDownload_createdAt_idx" ON "AppDownload"("createdAt");
