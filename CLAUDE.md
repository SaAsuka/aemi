# VOZEL (AEMI) プロジェクト

## 技術スタック
- Next.js 16 (App Router) + Prisma + Vercel Blob (private) + Vercel デプロイ
- 認証: iron-session（Cookie名 `aemi_session`）
- Node.js 22必須（20だとPrisma CLIがESMエラー）

## 認証パターン

### SessionData
`{ talentId?: string, role?: "talent" | "admin" }`

### 認証関数 (`src/lib/auth.ts`)
- `requireAdmin()` — admin以外は `/admin/login` にリダイレクト
- `requireTalent()` — talent認証 + セットアップ完了チェック（nameKana未設定なら `/setup` へ）
  - select: id, name, nameKana, stageName, category, status, gender, birthDate, height, email, subscriptionStatus, currentPeriodEnd
- `requireTalentRaw()` — セットアップ未完了も許可

### Server Actionの認証
- talent-photo/talent-work: 全関数冒頭で `verifyTalentAccess(talentId)` を呼ぶ
  - admin → 任意のtalentId操作可 / talent → 自分のIDのみ / それ以外 → throw
- talent-mypage: `getSession()` で自身のtalentIdを取得（他人のID指定不可）
- talent.ts（管理画面用）: ページ側で `requireAdmin()` 済み

## DBクエリ使い分け (`src/lib/actions/talent.ts`)

| 関数 | 用途 | データ量 |
|------|------|---------|
| `getTalent(id)` | 管理画面タレント詳細 | 全include + accessToken生成 |
| `getTalentApplications(talentId)` | マイページ応募履歴 | applicationsのみ |
| `getTalentForSettings(talentId)` | マイページ設定 | photos+worksのみ |
| `getTalents(filters)` | 管理画面一覧 | select（軽量） |
| `getTalentByToken(token)` | 外部アクセス | select（最小限） |

## キャッシュ戦略
- 管理画面のタレント更新: `updateTag("talents")` のみ
- マイページからの更新: `revalidatePath` + `updateTag("talents")`
- 写真/作品: `revalidatePath` で該当パスのみ

## Prisma カスケード
- TalentPhoto/TalentWork → Talent: Cascade あり
- Application → Talent: なし（手動削除）
- Schedule → Application: なし（手動削除）
- deleteTalent: schedule → application → talent の順で削除

## 環境構成
- **本番環境**: `main` ブランチ
- **テスト環境**: `vozel-test` ブランチ

## 環境運用ルール
- **本番環境（main）へのマージはユーザーの明示的な許可なく行わない**
- 作業開始時は、本番（main）・テスト（vozel-test）両ブランチを最新に pull してから始める

## ブラウザ互換性

フォームや画面を新規実装・修正する際は以下を確認すること。

### フォーム
- **`<form>` には必ず `noValidate` を付ける**
  iOS SafariではブラウザネイティブバリデーションがReactの `onSubmit` より先に発火し、独自エラーメッセージが表示されない場合がある
- **バリデーションはZod（サーバー）またはReact（クライアント）で実装する**
  HTMLの `required`・`minLength`・`type="email"` などブラウザ標準バリデーションには依存しない

### レイアウト
- **`min-h-screen`（100vh）はiOS Safariで高さが不足することがある**
  アドレスバーの表示・非表示により入力欄やボタンが隠れる場合がある。必要に応じて `100dvh` や `min-h-[100dvh]` を使用する
- **仮想キーボード表示時は `position: fixed` の表示を確認する**
  iOS Safari・Android Chromeではキーボード表示時に位置がずれることがある

### 入力
- **`type="date"`・`time`・`datetime-local` はブラウザごとにUIが異なる**
  デザインや操作性に依存する場合はライブラリ（例：Flatpickr）を使用する
- **`autocomplete` を適切に設定する**
  Safari・Chromeで自動入力挙動が異なるため、ログイン・会員登録画面では確認する

### CSS
- **SafariやWebViewで未対応・挙動差のあるCSSを使用していないか確認する**
  `backdrop-filter`・`position: sticky`・`100vh`・`overflow: hidden`・`:has()`・`aspect-ratio`
  新しいCSSを使用する場合は対応ブラウザを確認する

### JavaScript
- **Clipboard API・Share APIなどブラウザ依存APIはフォールバックを用意する**
- **`Intl`・`URL` など新しいAPIを利用する場合は対象ブラウザで動作確認する**

### このプロジェクト固有
- **LINE内蔵ブラウザ（WebView）に注意する**
  タレントがLINEアプリ経由でアクセスするケースがあり、写真アップロード（カメラ・ライブラリアクセス）などでSafari・Chromeと挙動が異なる場合がある

### 動作確認
最低限以下のブラウザで確認する。

| ブラウザ | 確認内容 |
|---------|---------|
| Chrome | PC・Android |
| Safari | iPhone・iPad |
| Edge | Windows |
| Firefox | PC（必要に応じて） |

## 既知の注意点
- Vercel Blob `addRandomSuffix: false` → ブラウザキャッシュ問題 → `blobProxyUrl` にtimestamp付与
- Route Handler内の `revalidatePath` はクライアント側に効かない → Server Action経由で呼ぶ
- Vercel Serverlessで短時間DB大量アクセス → プール枯渇注意
- ビルドスクリプトに `prisma migrate deploy` 追加済み

## KAMITEから案件を受け取る口（2026-09-14〜）

KAMITE（`develop/yokai-aomidori/app` ／ https://app.kamite.jp ）に届いた案件が、
`POST /api/external/jobs` からVOZELの案件として自動で登録される。**仕様書は `EXTERNAL_JOB_API.md` が正。**

- 🔴 **外から叩ける口。** 守りは `src/lib/external-job.ts` にまとめてある。
  キー照合（定数時間）・本文のHMAC署名・時刻の検証（5分）・1分20件の上限・全リクエストの記録。**ここを緩めない**
- 🔴 **送信元IPのホワイトリスト（`KAMITE_ALLOWED_IPS`）は既定で空＝未使用。**
  KAMITEはVercelで外向きIPが固定されないため（固定IPはEnterpriseのSecure Compute）。
  固定IPが取れる場所へ移したら値を入れるだけで有効になる
- 鍵は `KAMITE_API_KEY` / `KAMITE_API_SECRET`（KAMITE側の `VOZEL_API_KEY` / `VOZEL_API_SECRET` と同じ値）
- 同じ案件は増えない：`jobs.externalSource` + `jobs.externalId` で突き合わせて上書きする。
  **人が締め切った（CLOSED）・取り下げた（CANCELLED）案件は、送られてきても募集中に戻さない**
- 枠（roles）と提出物（requirements）は入れ物が無いので `jobs.note` に文章で入る。枠が1つのときだけ案件側の条件にも入れる
- 弾いたぶんも含めて `external_job_logs` に残る。**このテーブルを消さない**（不審なアクセスに気づくため）

## 踏んだ罠

- 🔴 **`vozel-test` が `main` から遅れていないか、マージ前に必ず確かめる**（2026-09-15 時点では追いついている。
  2026-09-14 時点では79コミット遅れていた）。遅れたまま
  **`vozel-test` を `main` にマージすると本番がそのぶん巻き戻る**（2026-09-14 時点なら1,790行の削除・
  Stripeのオプション購入やPDFダウンロードの修正が丸ごと消える）。テスト環境で作ったものを本番へ出すときは、
  **`origin/main` から枝を切って作り直す**。出す前に必ず `git diff origin/main..HEAD --stat` を見て、
  触っていないファイルが並んでいないか・削除行が追加行より多くないかを確かめる
- 🔴 **ローカルの `.env` は本番DBを指している**（Supabase `jolerxtkrxfhxjrilsrj`）。テスト環境は別のDB
  （`sdjpqumioxjmmbakizjv`）。**手元から `prisma migrate deploy` を打つと本番に当たる。**
  テストDBへ当てたいときは `vercel env pull --environment=preview --git-branch=vozel-test` で取った
  接続先を環境変数に入れてから実行する（2026-09-15 修正。それ以前は「.env はテスト環境」と誤記していた）
- 🔴 **`DIRECT_URL` は pooler 経由（`aws-1-....pooler.supabase.com:5432`）にする。**
  古い直接接続（`db.<ref>.supabase.co:5432`）はSupabase側で到達できなくなっており、
  **デプロイのたびにビルド中の `prisma migrate deploy` が静かに失敗し続ける**（アプリは
  `DATABASE_URL` で動くので気づけない）。2026-09-15 に本番・テストとも壊れているのを発見して直した。
  症状は「新しいテーブルだけ存在しない」。`prisma migrate status` で確認する
- 🔴 **Vercelの環境変数には「Production と Preview（全ブランチ）」で1件しか無いものがある＝テスト環境でも本番の値が使われる。**
  2026-09-15 に `SERVICE_ROLE_KEY` がこれで、テストから保存したファイルが本番のストレージへ行く状態だった。
  直し方は `npx vercel env add <名前> preview vozel-test`（ブランチ指定のほうが優先される）。
  入れる値は Supabase の API キー画面の **「legacy」タブの service_role**（新方式の `sb_secret_` ではない）。
  **環境変数を足しただけでは反映されない。`npx vercel redeploy <テスト環境のURL>` で入れ直す**
- ℹ️ `SUPABASE_URL` は設定していない。`src/lib/supabase-storage.ts` が `DATABASE_URL` から
  プロジェクトrefを割り出すので、DBの接続先が正しければストレージの向き先も自動でそろう
- ⚠️ **テーブルは実在するのに履歴だけ無い**状態がある（過去の `db push` の名残）。
  `migrate deploy` が `relation ... already exists` で止まったら
  **実テーブルの有無を確かめてから `migrate resolve --applied <名前>`** で履歴を実態に合わせる
- ⚠️ **既存のマイグレーション履歴は空のDBに順番どおり当て直せない**（`20260322230000_add_password_auth` が
  `type "AuthTokenType" does not exist` で落ちる）。差分は `--from-migrations` ではなく
  **`--from-config-datasource`（いまのDBとスキーマの差）**で出す。`prisma.config.ts` に `shadowDatabaseUrl` を用意してある
- ⚠️ **`npx prisma` は最新版（8系）を取ってきて `migrate` が無いと言われる。** `./node_modules/.bin/prisma` を使う
