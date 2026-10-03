-- Repair RefreshToken schema drift safely without resetting production data.
DO $$
BEGIN
  -- Add the current hashed token column and preserve legacy values when present.
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

  -- Ensure every current Prisma RefreshToken column exists.
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'RefreshToken' AND column_name = 'browser'
  ) THEN
    ALTER TABLE "RefreshToken" ADD COLUMN "browser" TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'RefreshToken' AND column_name = 'deviceId'
  ) THEN
    ALTER TABLE "RefreshToken" ADD COLUMN "deviceId" TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'RefreshToken' AND column_name = 'deviceName'
  ) THEN
    ALTER TABLE "RefreshToken" ADD COLUMN "deviceName" TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'RefreshToken' AND column_name = 'ipAddress'
  ) THEN
    ALTER TABLE "RefreshToken" ADD COLUMN "ipAddress" TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'RefreshToken' AND column_name = 'lastUsedAt'
  ) THEN
    ALTER TABLE "RefreshToken" ADD COLUMN "lastUsedAt" TIMESTAMP(3);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'RefreshToken' AND column_name = 'platform'
  ) THEN
    ALTER TABLE "RefreshToken" ADD COLUMN "platform" TEXT;
  END IF;

  -- Remove the obsolete legacy token uniqueness/index after migration.
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
