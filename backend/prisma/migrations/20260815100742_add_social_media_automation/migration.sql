-- CreateEnum
CREATE TYPE "SocialPlatform" AS ENUM ('INSTAGRAM', 'FACEBOOK', 'YOUTUBE');

-- CreateEnum
CREATE TYPE "SocialPostStatus" AS ENUM ('PENDING', 'GENERATING', 'READY', 'PUBLISHING', 'PUBLISHED', 'FAILED', 'CANCELLED');

-- CreateTable
CREATE TABLE "SocialMarketingConsent" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "autoPublish" BOOLEAN NOT NULL DEFAULT false,
    "platforms" JSONB NOT NULL,
    "consentVersion" TEXT NOT NULL DEFAULT '1.0',
    "consentedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialMarketingConsent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialMediaPost" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "consentId" TEXT,
    "platform" "SocialPlatform" NOT NULL,
    "status" "SocialPostStatus" NOT NULL DEFAULT 'PENDING',
    "caption" TEXT,
    "videoUrl" TEXT,
    "externalId" TEXT,
    "error" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialMediaPost_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SocialMarketingConsent_propertyId_key" ON "SocialMarketingConsent"("propertyId");

-- CreateIndex
CREATE INDEX "SocialMarketingConsent_ownerId_idx" ON "SocialMarketingConsent"("ownerId");

-- CreateIndex
CREATE INDEX "SocialMarketingConsent_approved_idx" ON "SocialMarketingConsent"("approved");

-- CreateIndex
CREATE INDEX "SocialMarketingConsent_autoPublish_idx" ON "SocialMarketingConsent"("autoPublish");

-- CreateIndex
CREATE INDEX "SocialMediaPost_propertyId_idx" ON "SocialMediaPost"("propertyId");

-- CreateIndex
CREATE INDEX "SocialMediaPost_platform_idx" ON "SocialMediaPost"("platform");

-- CreateIndex
CREATE INDEX "SocialMediaPost_status_idx" ON "SocialMediaPost"("status");

-- AddForeignKey
ALTER TABLE "SocialMarketingConsent" ADD CONSTRAINT "SocialMarketingConsent_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialMarketingConsent" ADD CONSTRAINT "SocialMarketingConsent_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialMediaPost" ADD CONSTRAINT "SocialMediaPost_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialMediaPost" ADD CONSTRAINT "SocialMediaPost_consentId_fkey" FOREIGN KEY ("consentId") REFERENCES "SocialMarketingConsent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
