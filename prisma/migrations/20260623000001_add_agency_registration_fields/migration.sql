ALTER TABLE "agencies" ADD COLUMN "emailVerified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "agencies" ADD COLUMN "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "agencies" ADD COLUMN "verifyToken" TEXT;
ALTER TABLE "agencies" ADD COLUMN "stripeCustomerId" TEXT;
ALTER TABLE "agencies" ADD COLUMN "subscriptionId" TEXT;
ALTER TABLE "agencies" ADD COLUMN "subscriptionStatus" "SubscriptionStatus" NOT NULL DEFAULT 'NONE';
ALTER TABLE "agencies" ADD COLUMN "currentPeriodEnd" TIMESTAMP(3);

CREATE UNIQUE INDEX "agencies_verifyToken_key" ON "agencies"("verifyToken");
CREATE UNIQUE INDEX "agencies_stripeCustomerId_key" ON "agencies"("stripeCustomerId");
CREATE UNIQUE INDEX "agencies_subscriptionId_key" ON "agencies"("subscriptionId");
