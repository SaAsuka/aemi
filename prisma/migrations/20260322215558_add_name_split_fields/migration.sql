-- カラム追加
ALTER TABLE "talents" ADD COLUMN "lastName" TEXT NOT NULL DEFAULT '';
ALTER TABLE "talents" ADD COLUMN "firstName" TEXT NOT NULL DEFAULT '';
ALTER TABLE "talents" ADD COLUMN "lastNameKana" TEXT NOT NULL DEFAULT '';
ALTER TABLE "talents" ADD COLUMN "firstNameKana" TEXT NOT NULL DEFAULT '';

-- 既存データをスペースで分割
UPDATE "talents"
SET
  "lastName" = CASE
    WHEN POSITION(' ' IN "name") > 0 THEN SUBSTRING("name" FROM 1 FOR POSITION(' ' IN "name") - 1)
    ELSE "name"
  END,
  "firstName" = CASE
    WHEN POSITION(' ' IN "name") > 0 THEN SUBSTRING("name" FROM POSITION(' ' IN "name") + 1)
    ELSE ''
  END,
  "lastNameKana" = CASE
    WHEN POSITION(' ' IN "nameKana") > 0 THEN SUBSTRING("nameKana" FROM 1 FOR POSITION(' ' IN "nameKana") - 1)
    ELSE "nameKana"
  END,
  "firstNameKana" = CASE
    WHEN POSITION(' ' IN "nameKana") > 0 THEN SUBSTRING("nameKana" FROM POSITION(' ' IN "nameKana") + 1)
    ELSE ''
  END;
