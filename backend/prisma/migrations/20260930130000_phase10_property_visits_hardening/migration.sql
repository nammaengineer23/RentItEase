-- Phase 10: prevent concurrent active property visits for the same property/time.
-- The partial unique index covers only states that reserve the slot.
CREATE UNIQUE INDEX "PropertyVisit_active_slot_unique"
ON "PropertyVisit" ("propertyId", "visitDate")
WHERE "status" IN ('PENDING', 'APPROVED');
