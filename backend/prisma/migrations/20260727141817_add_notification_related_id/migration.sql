-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "relatedId" TEXT;

-- CreateIndex
CREATE INDEX "Notification_relatedId_idx" ON "Notification"("relatedId");
