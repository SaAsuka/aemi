-- SocialPlatform enum
CREATE TYPE "SocialPlatform" AS ENUM ('INSTAGRAM', 'X', 'TIKTOK', 'WEBSITE');

-- TalentBankAccount テーブル
CREATE TABLE "talent_bank_accounts" (
    "id" TEXT NOT NULL,
    "talentId" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "branchName" TEXT NOT NULL,
    "accountType" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "accountHolder" TEXT NOT NULL,
    CONSTRAINT "talent_bank_accounts_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "talent_bank_accounts_talentId_key" ON "talent_bank_accounts"("talentId");
ALTER TABLE "talent_bank_accounts" ADD CONSTRAINT "talent_bank_accounts_talentId_fkey" FOREIGN KEY ("talentId") REFERENCES "talents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- TalentSocialLink テーブル
CREATE TABLE "talent_social_links" (
    "id" TEXT NOT NULL,
    "talentId" TEXT NOT NULL,
    "platform" "SocialPlatform" NOT NULL,
    "url" TEXT NOT NULL,
    CONSTRAINT "talent_social_links_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "talent_social_links_talentId_idx" ON "talent_social_links"("talentId");
CREATE UNIQUE INDEX "talent_social_links_talentId_platform_key" ON "talent_social_links"("talentId", "platform");
ALTER TABLE "talent_social_links" ADD CONSTRAINT "talent_social_links_talentId_fkey" FOREIGN KEY ("talentId") REFERENCES "talents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- TalentSubscription テーブル
CREATE TABLE "talent_subscriptions" (
    "id" TEXT NOT NULL,
    "talentId" TEXT NOT NULL,
    "stripeCustomerId" TEXT,
    "subscriptionId" TEXT,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'NONE',
    "currentPeriodEnd" TIMESTAMP(3),
    CONSTRAINT "talent_subscriptions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "talent_subscriptions_talentId_key" ON "talent_subscriptions"("talentId");
CREATE UNIQUE INDEX "talent_subscriptions_stripeCustomerId_key" ON "talent_subscriptions"("stripeCustomerId");
CREATE UNIQUE INDEX "talent_subscriptions_subscriptionId_key" ON "talent_subscriptions"("subscriptionId");
ALTER TABLE "talent_subscriptions" ADD CONSTRAINT "talent_subscriptions_talentId_fkey" FOREIGN KEY ("talentId") REFERENCES "talents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- データ移行: 銀行口座
INSERT INTO "talent_bank_accounts" ("id", "talentId", "bankName", "branchName", "accountType", "accountNumber", "accountHolder")
SELECT gen_random_uuid()::text, "id", "bankName", "bankBranch", "bankAccountType", "bankAccountNumber", "bankAccountHolder"
FROM "talents"
WHERE "bankName" IS NOT NULL AND "bankName" != '';

-- データ移行: SNSリンク
INSERT INTO "talent_social_links" ("id", "talentId", "platform", "url")
SELECT gen_random_uuid()::text, "id", 'INSTAGRAM', "instagramUrl"
FROM "talents" WHERE "instagramUrl" IS NOT NULL AND "instagramUrl" != '';

INSERT INTO "talent_social_links" ("id", "talentId", "platform", "url")
SELECT gen_random_uuid()::text, "id", 'X', "xUrl"
FROM "talents" WHERE "xUrl" IS NOT NULL AND "xUrl" != '';

INSERT INTO "talent_social_links" ("id", "talentId", "platform", "url")
SELECT gen_random_uuid()::text, "id", 'TIKTOK', "tiktokUrl"
FROM "talents" WHERE "tiktokUrl" IS NOT NULL AND "tiktokUrl" != '';

INSERT INTO "talent_social_links" ("id", "talentId", "platform", "url")
SELECT gen_random_uuid()::text, "id", 'WEBSITE', "websiteUrl"
FROM "talents" WHERE "websiteUrl" IS NOT NULL AND "websiteUrl" != '';

-- データ移行: サブスクリプション
INSERT INTO "talent_subscriptions" ("id", "talentId", "stripeCustomerId", "subscriptionId", "status", "currentPeriodEnd")
SELECT gen_random_uuid()::text, "id", "stripeCustomerId", "subscriptionId", "subscriptionStatus", "currentPeriodEnd"
FROM "talents";

-- 旧カラム削除
ALTER TABLE "talents" DROP COLUMN "bankName";
ALTER TABLE "talents" DROP COLUMN "bankBranch";
ALTER TABLE "talents" DROP COLUMN "bankAccountType";
ALTER TABLE "talents" DROP COLUMN "bankAccountNumber";
ALTER TABLE "talents" DROP COLUMN "bankAccountHolder";
ALTER TABLE "talents" DROP COLUMN "instagramUrl";
ALTER TABLE "talents" DROP COLUMN "xUrl";
ALTER TABLE "talents" DROP COLUMN "tiktokUrl";
ALTER TABLE "talents" DROP COLUMN "websiteUrl";
ALTER TABLE "talents" DROP COLUMN "stripeCustomerId";
ALTER TABLE "talents" DROP COLUMN "subscriptionStatus";
ALTER TABLE "talents" DROP COLUMN "subscriptionId";
ALTER TABLE "talents" DROP COLUMN "currentPeriodEnd";
