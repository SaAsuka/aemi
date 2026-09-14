-- 外部システム（KAMITE）から案件を受け取るための追加。
-- 既存の案件・タレントには触らない（列の追加とテーブルの新設のみ）。

-- AlterTable
ALTER TABLE "jobs" ADD COLUMN     "externalId" TEXT,
ADD COLUMN     "externalSource" TEXT,
ADD COLUMN     "sourceUrl" TEXT;

-- CreateTable
CREATE TABLE "external_job_logs" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "externalId" TEXT,
    "ip" TEXT,
    "result" TEXT NOT NULL,
    "httpStatus" INTEGER NOT NULL,
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "external_job_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "external_job_logs_createdAt_idx" ON "external_job_logs"("createdAt");

-- CreateIndex
CREATE INDEX "external_job_logs_source_createdAt_idx" ON "external_job_logs"("source", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "jobs_externalSource_externalId_key" ON "jobs"("externalSource", "externalId");
