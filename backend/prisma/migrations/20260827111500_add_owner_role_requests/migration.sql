CREATE TYPE "OwnerRequestStatus" AS ENUM ('NONE', 'PENDING', 'APPROVED', 'REJECTED');

ALTER TABLE "User"
ADD COLUMN "ownerRequestStatus" "OwnerRequestStatus" NOT NULL DEFAULT 'NONE',
ADD COLUMN "ownerRequestedAt" TIMESTAMP(3),
ADD COLUMN "ownerReviewedAt" TIMESTAMP(3);

CREATE INDEX "User_ownerRequestStatus_idx" ON "User"("ownerRequestStatus");
