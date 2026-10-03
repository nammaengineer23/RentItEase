-- Production has a legacy non-null RefreshToken.jti column that is no longer
-- represented by the Prisma model. Its NOT NULL constraint causes login to fail
-- when Prisma creates a refresh-token row without jti. Remove it safely.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'RefreshToken'
      AND column_name = 'jti'
  ) THEN
    ALTER TABLE "RefreshToken" DROP COLUMN "jti";
  END IF;
END $$;
