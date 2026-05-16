-- AlterTable: emailにUNIQUE制約を追加
-- ※ 重複メールが存在する場合はマイグレーションが失敗します
-- 　 事前に管理画面で重複タレントを削除してからデプロイしてください
ALTER TABLE "talents" ADD CONSTRAINT "talents_email_key" UNIQUE ("email");
