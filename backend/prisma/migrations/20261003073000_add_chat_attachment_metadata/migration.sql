-- Add nullable attachment metadata so every uploaded chat object can be reconciled
-- against a persisted message reference.
ALTER TABLE "Message"
  ADD COLUMN "attachmentPublicId" TEXT,
  ADD COLUMN "attachmentFileName" TEXT,
  ADD COLUMN "attachmentMimeType" TEXT,
  ADD COLUMN "attachmentSize" INTEGER;

CREATE INDEX "Message_attachmentPublicId_idx"
  ON "Message"("attachmentPublicId");
