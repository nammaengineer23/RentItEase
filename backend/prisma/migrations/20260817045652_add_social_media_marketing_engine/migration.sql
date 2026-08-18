-- CreateEnum
CREATE TYPE "SocialCampaignStatus" AS ENUM ('DRAFT', 'QUEUED', 'GENERATING', 'READY', 'SCHEDULED', 'PUBLISHING', 'PUBLISHED', 'FAILED', 'CANCELLED');

-- CreateTable
CREATE TABLE "SocialCampaign" (
    "id" TEXT NOT NULL,
    "propertyId" INTEGER NOT NULL,
    "status" "SocialCampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "template" TEXT,
    "caption" TEXT,
    "hashtags" TEXT[],
    "videoUrl" TEXT,
    "deepLink" TEXT,
    "qrCodeUrl" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialAccountConnection" (
    "id" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "accountName" TEXT,
    "encryptedAccessToken" TEXT NOT NULL,
    "encryptedRefreshToken" TEXT,
    "expiresAt" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialAccountConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialAnalyticsSnapshot" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "shares" INTEGER NOT NULL DEFAULT 0,
    "leads" INTEGER NOT NULL DEFAULT 0,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SocialAnalyticsSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SocialCampaign_propertyId_idx" ON "SocialCampaign"("propertyId");

-- CreateIndex
CREATE INDEX "SocialCampaign_status_idx" ON "SocialCampaign"("status");

-- CreateIndex
CREATE INDEX "SocialAccountConnection_platform_idx" ON "SocialAccountConnection"("platform");

-- CreateIndex
CREATE UNIQUE INDEX "SocialAccountConnection_platform_accountId_key" ON "SocialAccountConnection"("platform", "accountId");

-- CreateIndex
CREATE INDEX "SocialAnalyticsSnapshot_campaignId_idx" ON "SocialAnalyticsSnapshot"("campaignId");

-- CreateIndex
CREATE INDEX "SocialAnalyticsSnapshot_platform_capturedAt_idx" ON "SocialAnalyticsSnapshot"("platform", "capturedAt");
