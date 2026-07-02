-- CreateTable
CREATE TABLE "talent_login_histories" (
    "id" TEXT NOT NULL,
    "talentId" TEXT NOT NULL,
    "ua" TEXT,
    "ip" TEXT,
    "txnId" TEXT,
    "loggedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "talent_login_histories_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "talent_login_histories" ADD CONSTRAINT "talent_login_histories_talentId_fkey" FOREIGN KEY ("talentId") REFERENCES "talents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
