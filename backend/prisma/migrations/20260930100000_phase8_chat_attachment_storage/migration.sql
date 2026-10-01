-- Phase 8: private chat attachment references
ALTER TABLE "Message"
  ADD COLUMN "attachmentPublicId" TEXT,
  ADD COLUMN "attachmentUrl" TEXT,
  ADD COLUMN "attachmentMime" TEXT;
