-- Performance indexes for hot read paths, pagination, and media ordering.
CREATE INDEX IF NOT EXISTS "Property_isVerified_isAvailable_createdAt_idx"
  ON "Property" ("isVerified", "isAvailable", "createdAt");
CREATE INDEX IF NOT EXISTS "Property_isVerified_isAvailable_city_createdAt_idx"
  ON "Property" ("isVerified", "isAvailable", "city", "createdAt");
CREATE INDEX IF NOT EXISTS "Property_ownerId_createdAt_idx"
  ON "Property" ("ownerId", "createdAt");
CREATE INDEX IF NOT EXISTS "Property_latitude_longitude_isVerified_isAvailable_idx"
  ON "Property" ("latitude", "longitude", "isVerified", "isAvailable");
CREATE INDEX IF NOT EXISTS "PropertyImage_propertyId_displayOrder_idx"
  ON "PropertyImage" ("propertyId", "displayOrder");
CREATE INDEX IF NOT EXISTS "Favorite_userId_createdAt_idx"
  ON "Favorite" ("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "Review_propertyId_createdAt_idx"
  ON "Review" ("propertyId", "createdAt");
CREATE INDEX IF NOT EXISTS "PropertyVisit_tenantId_createdAt_idx"
  ON "PropertyVisit" ("tenantId", "createdAt");
CREATE INDEX IF NOT EXISTS "PropertyVisit_propertyId_visitDate_status_idx"
  ON "PropertyVisit" ("propertyId", "visitDate", "status");
CREATE INDEX IF NOT EXISTS "Booking_tenantId_createdAt_idx"
  ON "Booking" ("tenantId", "createdAt");
CREATE INDEX IF NOT EXISTS "Booking_propertyId_status_idx"
  ON "Booking" ("propertyId", "status");
CREATE INDEX IF NOT EXISTS "Payment_status_createdAt_idx"
  ON "Payment" ("status", "createdAt");
CREATE INDEX IF NOT EXISTS "Notification_userId_isRead_createdAt_idx"
  ON "Notification" ("userId", "isRead", "createdAt");
CREATE INDEX IF NOT EXISTS "Notification_userId_createdAt_idx"
  ON "Notification" ("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "Conversation_ownerId_updatedAt_idx"
  ON "Conversation" ("ownerId", "updatedAt");
CREATE INDEX IF NOT EXISTS "Conversation_tenantId_updatedAt_idx"
  ON "Conversation" ("tenantId", "updatedAt");
CREATE INDEX IF NOT EXISTS "Message_conversationId_createdAt_idx"
  ON "Message" ("conversationId", "createdAt");
CREATE INDEX IF NOT EXISTS "Message_conversationId_readAt_senderId_idx"
  ON "Message" ("conversationId", "readAt", "senderId");
