-- JobDateType enum
CREATE TYPE "JobDateType" AS ENUM ('AUDITION', 'SHOOTING', 'OTHER');

-- JobDate テーブル作成
CREATE TABLE "job_dates" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "type" "JobDateType" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,
    "location" TEXT,
    "note" TEXT,

    CONSTRAINT "job_dates_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "job_dates_jobId_idx" ON "job_dates"("jobId");
ALTER TABLE "job_dates" ADD CONSTRAINT "job_dates_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 既存の startsAt/endsAt データを JobDate に移行
INSERT INTO "job_dates" ("id", "jobId", "type", "date")
SELECT gen_random_uuid(), "id", 'OTHER', "startsAt"
FROM "jobs" WHERE "startsAt" IS NOT NULL;

INSERT INTO "job_dates" ("id", "jobId", "type", "date", "note")
SELECT gen_random_uuid(), "id", 'OTHER', "endsAt", '終了日'
FROM "jobs" WHERE "endsAt" IS NOT NULL AND "endsAt" != "startsAt";

-- startsAt/endsAt カラム削除
ALTER TABLE "jobs" DROP COLUMN "startsAt";
ALTER TABLE "jobs" DROP COLUMN "endsAt";
