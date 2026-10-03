-- Repair RefreshToken schema drift safely without resetting production data.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'RefreshToken' AND column_name = 'hashedToken'
  ) THEN
    ALTER TABLE "RefreshToken" ADD COLUMN "hashedToken" TEXT;

    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'RefreshToken' AND column_name = 'token'
    ) THEN
      UPDATE "RefreshToken" SET "hashedToken" = "token" WHERE "hashedToken" IS NULL;
    END IF;

    UPDATE "RefreshToken"
    SET "hashedToken" = md5(random()::text || clock_timestamp()::text || id)
    WHERE "hashedToken" IS NULL;

    ALTER TABLE "RefreshToken" ALTER COLUMN "hashedToken" SET NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public' AND indexname = 'RefreshToken_token_key'
  ) THEN
    DROP INDEX "RefreshToken_token_key";
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'RefreshToken' AND column_name = 'token'
  ) THEN
    ALTER TABLE "RefreshToken" DROP COLUMN "token";
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "RefreshToken_userId_idx" ON "RefreshToken"("userId");
