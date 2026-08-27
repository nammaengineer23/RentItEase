CREATE TABLE "AppFeedback" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "platform" TEXT,
    "appVersion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AppFeedback_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "AppFeedback_rating_check" CHECK ("rating" BETWEEN 1 AND 5)
);

CREATE INDEX "AppFeedback_userId_idx" ON "AppFeedback"("userId");
CREATE INDEX "AppFeedback_rating_idx" ON "AppFeedback"("rating");
CREATE INDEX "AppFeedback_createdAt_idx" ON "AppFeedback"("createdAt");

ALTER TABLE "AppFeedback" ADD CONSTRAINT "AppFeedback_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
