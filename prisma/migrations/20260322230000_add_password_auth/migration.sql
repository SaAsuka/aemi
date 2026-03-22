-- パスワード認証追加

-- passwordHash カラム追加
ALTER TABLE "talents" ADD COLUMN "passwordHash" TEXT;

-- AuthTokenType enum: MAGIC_LINK → PASSWORD_RESET に置換
ALTER TYPE "AuthTokenType" RENAME VALUE 'MAGIC_LINK' TO 'PASSWORD_RESET';

-- 既存の MAGIC_LINK トークンを PASSWORD_RESET に変換（enum rename で自動的に変換済み）
