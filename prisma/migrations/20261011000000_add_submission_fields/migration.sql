-- 案件ごとの自由な提出項目（specs/001-kamite-custom-submissions）
-- 追加だけ。既存のカラム・テーブルは変更しない。
-- （migrate diff に出た agencies 等の DROP はテストDBの残骸で本件とは無関係のため含めない）

-- AlterTable
ALTER TABLE "jobs" ADD COLUMN "submissionFields" JSONB;

-- AlterTable
ALTER TABLE "applications" ADD COLUMN "submissionAnswers" JSONB,
ADD COLUMN "hasMissingAnswers" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "form_error_logs" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "form" TEXT NOT NULL,
    "talentId" TEXT,
    "jobId" TEXT,
    "field" TEXT,
    "reason" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "message" TEXT,
    "userAgent" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "form_error_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "form_error_logs_code_key" ON "form_error_logs"("code");

-- CreateIndex
CREATE INDEX "form_error_logs_createdAt_idx" ON "form_error_logs"("createdAt");

-- CreateIndex
CREATE INDEX "form_error_logs_talentId_idx" ON "form_error_logs"("talentId");

-- CreateIndex
CREATE INDEX "form_error_logs_talentId_jobId_field_idx" ON "form_error_logs"("talentId", "jobId", "field");
