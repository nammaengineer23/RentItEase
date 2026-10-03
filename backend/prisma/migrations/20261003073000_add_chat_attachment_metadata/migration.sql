-- Add nullable attachment metadata so every uploaded chat object can be reconciled
-- against a persisted message reference.
ALTER TABLE "Message"
  ADD COLUMN IF NOT EXISTS "attachmentPublicId" TEXT,
  ADD COLUMN IF NOT EXISTS "attachmentFileName" TEXT,
  ADD COLUMN IF NOT EXISTS "attachmentMimeType" TEXT,
  ADD COLUMN IF NOT EXISTS "attachmentSize" INTEGER;

CREATE INDEX IF NOT EXISTS "Message_attachmentPublicId_idx"
  ON "Message"("attachmentPublicId");
