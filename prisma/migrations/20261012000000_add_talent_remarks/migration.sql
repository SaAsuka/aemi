-- タレントからの備考（specs/001-kamite-custom-submissions US7）
-- 追加だけ。既存のカラム・テーブルは変更しない。
-- （migrate diff に出た agencies 等の DROP はテストDBの残骸で本件とは無関係のため含めない）

-- AlterTable
ALTER TABLE "applications" ADD COLUMN "talentRemarks" TEXT;
