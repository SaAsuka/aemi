-- CreateTable
CREATE TABLE "user_events" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "userType" TEXT,
    "eventName" TEXT NOT NULL,
    "properties" JSONB,
    "ip" TEXT,
    "ua" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_events_userId_userType_idx" ON "user_events"("userId", "userType");

-- CreateIndex
CREATE INDEX "user_events_eventName_idx" ON "user_events"("eventName");
