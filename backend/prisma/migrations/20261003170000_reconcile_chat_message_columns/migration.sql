-- Reconcile chat message attachment columns on databases where the
-- previous migration was recorded as applied but the columns are absent.
-- IF NOT EXISTS keeps this migration safe on already-correct databases.

ALTER TABLE "Message"
  ADD COLUMN IF NOT EXISTS "attachmentPublicId" TEXT,
  ADD COLUMN IF NOT EXISTS "attachmentFileName" TEXT,
  ADD COLUMN IF NOT EXISTS "attachmentMimeType" TEXT,
  ADD COLUMN IF NOT EXISTS "attachmentSize" INTEGER;
