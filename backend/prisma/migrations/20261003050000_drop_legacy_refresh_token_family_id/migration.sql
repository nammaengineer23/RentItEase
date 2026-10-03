-- Remove the remaining legacy RefreshToken.familyId column from production schema drift.
-- The current Prisma RefreshToken model does not define familyId, so a legacy
-- NOT NULL constraint prevents token creation with Prisma P2011.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'RefreshToken'
      AND column_name = 'familyId'
  ) THEN
    ALTER TABLE "RefreshToken" DROP COLUMN "familyId";
  END IF;
END $$;
