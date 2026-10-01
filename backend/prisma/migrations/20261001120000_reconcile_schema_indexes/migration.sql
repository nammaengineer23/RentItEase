-- Reconcile indexes created by earlier hardening migrations with the Prisma schema.
DROP INDEX IF EXISTS "Notification_userId_createdAt_idx";
DROP INDEX IF EXISTS "Review_propertyId_idx";
CREATE INDEX IF NOT EXISTS "PropertyVisit_propertyId_visitDate_status_idx"
  ON "PropertyVisit" ("propertyId", "visitDate", "status");
