ALTER TABLE "MembershipPlan"
  ADD COLUMN IF NOT EXISTS "trialDays" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "features" JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS "displayOrder" INTEGER NOT NULL DEFAULT 0;

UPDATE "MembershipPlan"
SET "trialDays" = 30
WHERE "code" = 'PREMIUM' AND "trialDays" = 0;

CREATE INDEX IF NOT EXISTS "MembershipPlan_displayOrder_idx"
  ON "MembershipPlan"("displayOrder");
