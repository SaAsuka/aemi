-- 代理店機能追加

-- AgencyStatus enum
CREATE TYPE "AgencyStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- agencies テーブル
CREATE TABLE "agencies" (
  "id"           TEXT             NOT NULL,
  "name"         TEXT             NOT NULL,
  "email"        TEXT             NOT NULL,
  "passwordHash" TEXT,
  "feePercent"   DOUBLE PRECISION NOT NULL DEFAULT 0.6,
  "contactName"  TEXT,
  "contactPhone" TEXT,
  "address"      TEXT,
  "status"       "AgencyStatus"   NOT NULL DEFAULT 'ACTIVE',
  "note"         TEXT,
  "createdAt"    TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "agencies_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "agencies_email_key" ON "agencies"("email");

-- agency_relations テーブル（階層の中間テーブル）
CREATE TABLE "agency_relations" (
  "parentId" TEXT NOT NULL,
  "childId"  TEXT NOT NULL,

  CONSTRAINT "agency_relations_pkey"      PRIMARY KEY ("parentId", "childId"),
  CONSTRAINT "agency_relations_parent_fk" FOREIGN KEY ("parentId") REFERENCES "agencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "agency_relations_child_fk"  FOREIGN KEY ("childId")  REFERENCES "agencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- agency_admins テーブル
CREATE TABLE "agency_admins" (
  "id"           TEXT         NOT NULL,
  "agencyId"     TEXT         NOT NULL,
  "name"         TEXT         NOT NULL,
  "email"        TEXT         NOT NULL,
  "passwordHash" TEXT,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "agency_admins_pkey"      PRIMARY KEY ("id"),
  CONSTRAINT "agency_admins_agency_fk" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "agency_admins_email_key" ON "agency_admins"("email");

-- 既存テーブルに agencyId を追加（nullable・既存データに影響なし）
ALTER TABLE "talents" ADD COLUMN IF NOT EXISTS "agencyId" TEXT;
ALTER TABLE "jobs"    ADD COLUMN IF NOT EXISTS "agencyId" TEXT;
ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "agencyId" TEXT;
ALTER TABLE "options" ADD COLUMN IF NOT EXISTS "agencyId" TEXT;

-- 外部キー制約
ALTER TABLE "talents" ADD CONSTRAINT "talents_agency_fk" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "jobs"    ADD CONSTRAINT "jobs_agency_fk"    FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "clients" ADD CONSTRAINT "clients_agency_fk" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "options" ADD CONSTRAINT "options_agency_fk" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
