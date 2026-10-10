# Implementation Plan: 案件ごとの提出項目を応募フォームで受け取る

**Branch**: `001-kamite-custom-submissions`（`origin/vozel-test` から作成） | **Date**: 2026-10-10 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-kamite-custom-submissions/spec.md`

## Summary

KAMITEから届く提出物（項目名・種類・必須・指示）を案件の「自由項目」として保存し、タレントの応募フォームに1項目ずつ出す。名前・年齢・身長はプロフィールから埋める（応募フォームからプロフィールは書き換えない）。コンポジ項目はフォームに出さず、応募詳細でタレントに登録済みのコンポジットを表示する（コンポジットの仕組みは変えない）。アップロードの失敗・止まった場合は「あとで別途送る」で応募まで進め、失敗は受付番号つきで記録する。管理画面に応募詳細の画面を新設し、回答の確認・管理者による登録・写真の応募単位ZIPダウンロードができるようにする。VOZELの案件編集でも自由項目を足せる。

技術的には、`jobs` と `applications` に Json カラムを1つずつ（＋一覧の絞り込み用に `applications.hasMissingAnswers`）足して自由項目・回答を持たせ（既存の4種類の仕組みは一切変えない）、形は zod で守る。調査で見つかった既存の穴のうち、本機能が依存するもの — 応募処理の本人確認なし・提出物ファイルの閲覧制限なし・4.5MBを超えるファイルが上がらない — は本機能の中で塞ぐ（詳細は [research.md](./research.md)）。

## Technical Context

**Language/Version**: TypeScript 5 / Node.js 22

**Primary Dependencies**: Next.js 16 (App Router, Server Actions)、Prisma 7（adapter-pg）、zod 4、iron-session、@supabase/supabase-js、**追加: fflate**（ブラウザでのZIP作成）

**Storage**: PostgreSQL（Supabase）、Supabase Storage（バケット `talent-files`）

**Testing**: vitest（`src/**/*.test.ts`）— 純粋関数のみ（開発原則 第5条）

**Target Platform**: Vercel（Functions の本文上限 4.5MB）、タレントはスマホ中心（iPhone Safari・LINE内蔵ブラウザ・Android Chrome）

**Project Type**: Webアプリ（単一の Next.js プロジェクト）

**Performance Goals**: 応募フォームは50項目でも表示・送信できる。応募送信は通常の応募と同程度（数秒以内）

**Constraints**: 既存の4種類の提出物・既存の案件と応募の表示と動作を変えない。KAMITE受け口の形式を変えない。本番は明示的な許可なしに触らない

**Scale/Scope**: 案件あたり自由項目は最大50。応募は月数百件規模

## Constitution Check

| 条 | 内容 | 本計画での扱い | 判定 |
|---|---|---|---|
| 第1条 | 本番は明示的な許可なしに触らない | 開発は `origin/vozel-test` から切ったブランチ。本番反映は許可後、`origin/main` から切り直して該当ファイルだけ移植し `git diff origin/main..HEAD --stat` を確認 | OK |
| 第2条 | テスト環境で確認してから本番 | quickstart.md の S1〜S8 をテスト環境で実施 → 山中さんに触ってもらう → 本番 | OK |
| 第3条 | マイグレーションは安全第一 | 追加のみ（Json?×2・Boolean×1・新テーブル1）。`migrate diff --from-config-datasource` で差分確認、**SQLをユーザーに見せて承認後に**テストDBへ適用、本番はSQL Editorでユーザーが実行し `_prisma_migrations` に記録 | OK |
| 第4条 | 重要な情報はDBに | 回答・失敗記録はDB。端末（localStorage）に置くのは下書きと未送信の失敗報告だけで、消えても応募そのものは困らない用途に限る | OK |
| 第5条 | ロジックは関数にしてテスト | `detectAutofill` / 項目キー / 再送時の引き継ぎ / 回答の検証 / `hasMissingRequired` / `classifyUploadError` / 受付番号 / `decideApplicant` / ZIP内ファイル名 / `shouldRetryReport` / プロフィール初期値（年齢の計算）、をテスト | OK |
| 第6条 | Safari/iOSを軽視しない | フォームは `noValidate`、HEIC対応、直接アップロードで4.5MB問題を回避、S8で実機確認 | OK |
| 第7条 | 一時的な対応は片付ける | テスト用KAMITE送信スクリプトは `scripts/` に置き、本番反映時は移植しない | OK |
| 第8条 | 環境変数・秘密情報 | 公開鍵（anon key）が必要になった場合のみ `NEXT_PUBLIC_SUPABASE_ANON_KEY` をテスト・本番それぞれに追加。失敗記録に秘密情報・入力値を残さない | OK |

**設計後の再確認**: 違反なし。Complexity Tracking は不要。

## Project Structure

### Documentation (this feature)

```text
specs/001-kamite-custom-submissions/
├── spec.md
├── plan.md              # このファイル
├── research.md          # 調査結果と判断（既存の問題 P1〜P6 を含む）
├── data-model.md        # Json の中身・新テーブル
├── quickstart.md        # 動作確認の手順
├── contracts/
│   └── interfaces.md    # KAMITE受け口・アップロードURL発行・ファイル配信・応募送信・管理画面
├── checklists/
│   └── requirements.md
└── tasks.md             # /speckit-tasks で作成
```

### Source Code (repository root)

```text
prisma/
├── schema.prisma                                   # 変更: Job.submissionFields, Application.submissionAnswers, Application.hasMissingAnswers, FormErrorLog 追加
└── migrations/2026xxxx_add_submission_fields/      # 新規

src/lib/
├── submission-fields.ts                            # 新規: zod定義・detectAutofill・makeKamiteFieldKey/makeVozelFieldKey・mergeKamiteFields・回答の検証・hasMissingRequired・プロフィール初期値
├── submission-fields.test.ts                       # 新規
├── upload-errors.ts / .test.ts                     # 新規: classifyUploadError
├── applicant.ts / .test.ts                         # 新規: resolveApplicant（判定部分を純粋関数に分離）
├── error-code.ts / .test.ts                        # 新規（サーバー・ブラウザ共用）: 受付番号の生成・形式チェック
├── form-error-log.ts                               # 新規: form_error_logs への記録＋logger
├── client-upload.ts                                # 新規（ブラウザ用）: 直接アップロード・進み具合・30秒止まったら中止
├── client-error-report.ts                          # 新規（ブラウザ用）: 失敗の報告・届かなければ端末にためて後で送る
├── apply-draft.ts                                  # 新規（ブラウザ用）: 入力の途中保存
├── actions/application.ts                          # 変更: 本人確認・自由項目の検証と保存・応募済み確認（削除処理は変えない）
├── actions/job.ts                                  # 変更: 案件の作成・更新で submissionFields を保存
├── supabase-storage.ts                             # 変更（追加のみ）: createUploadUrl
└── actions/application-detail.ts                   # 新規: 応募詳細の取得・管理者による回答の登録/修正（requireAdmin）

src/app/
├── api/external/jobs/route.ts                      # 変更: requirements → submissionFields、note から提出物の文章を外す
├── api/submissions/upload-url/route.ts             # 新規: 署名付きアップロードURLの発行
├── api/form-errors/route.ts                        # 新規: 端末で起きた失敗の報告（本人確認・回数制限）
├── api/blob/route.ts                               # 変更: applications/ だけ権限確認
├── (talent)/jobs/[id]/page.tsx                     # 変更: 自由項目・プロフィール初期値（読むだけ）・t をフォームへ渡す
├── (admin)/admin/applications/[id]/page.tsx        # 新規: 応募詳細
└── (admin)/admin/error-logs/page.tsx               # 新規: 失敗の記録一覧

src/components/
├── job-application-form.tsx                        # 変更: 自由項目の入力欄・項目ごとのエラー・下書き保存（既存4種類の部分は見た目・動きを変えない）
├── submission-field-input.tsx                      # 新規: 種類ごとの入力欄（写真/ファイル/文字/URL）
├── admin/job-editor-form.tsx                       # 変更: 自由項目の編集欄を「提出物」セクションの下に追加
├── admin/submission-fields-editor.tsx              # 新規: 足す・直す・消す・並べ替え・autofill の変更
├── admin/application-answers.tsx                   # 新規: 応募詳細の回答表示
├── admin/photo-zip-button.tsx                      # 新規: 写真の一括ダウンロード（fflate）
├── admin/application-table.tsx                     # 変更: 「内容を見る」リンクを追加
└── (admin/jobs/[id]/page.tsx の応募者欄)            # 変更: 「内容を見る」リンクを追加

scripts/send-test-kamite-job.ts                     # 新規: テスト環境用（本番へは移植しない）
EXTERNAL_JOB_API.md                                 # 変更: 提出物の扱いの記述を更新
CLAUDE.md                                           # 変更: 「踏んだ罠」に4.5MB問題と /api/blob の権限を追記
```

**Structure Decision**: 既存の単一 Next.js 構成に沿う。判定・検証ロジックは `src/lib/` の純粋関数に寄せ、Server Action・Route Handler・画面はそれを呼ぶだけにする。

## 実装の順番（tasks.md の骨組み）

既存を壊さないことが最優先なので、**「足すだけ」の土台 → 安全対策 → 新機能 → 画面** の順にし、各段階で既存の動きを確認する。

1. **検証スパイク**: 署名付きアップロードURLへ anon key なしで PUT できるか、署名付きURLをブラウザから fetch できるか（CORS）をテスト環境で確認（research R5・R8）
2. **土台**: スキーマ追加・マイグレーション（テストDB）・`submission-fields.ts` とテスト
3. **安全対策（P1・P2）**: `resolveApplicant` を応募処理に組み込み、`status` 固定、`/api/blob` の `applications/` 制限、コンポジ必須のサーバー側確認（タレント本人・専用リンクのみ。代理応募は今までどおり）。→ **既存の応募・代理応募が今までどおり動くことを確認**
4. **KAMITE受け口**: requirements → submissionFields、note から外す、再送の置き換え
5. **アップロード**: `upload-url` 発行、直接アップロード（進み具合・30秒止まったら中止）、`classifyUploadError`
6. **応募フォーム**: 自由項目の入力欄・プロフィール初期値（書き戻しなし）・コンポジ項目は出さない・項目ごとのエラー・下書き・送信が30秒で終わらないときの応募済み確認・アップロード失敗時の「あとで別途送る」と完了画面の案内
7. **失敗の記録**: `form_error_logs`（受付番号つき）・端末からの報告窓口 `/api/form-errors`・届かなかった報告の再送・`/admin/error-logs`
8. **管理画面**: 応募詳細・回答の登録/修正・ZIP・「内容を見る」リンク・「未提出あり」の印と絞り込み・案件編集の自由項目エディタ
9. **ドキュメント更新**（削除処理には手を入れない）
10. **確認**: quickstart S1〜S8、`npm test`、`npx tsc --noEmit`

コミットは CLAUDE.md の規約どおり、機能修正は1機能ずつ、デザイン修正と混ぜない。`vozel-test` への push はユーザーの許可後。

## 本機能の範囲外（別タスク）

- **登録フォームのエラー対策**: 原因の第一候補は4.5MB問題（research P4）。Vercelのログで 413 を確認してから、本機能で作る直接アップロード・失敗記録を登録フォームにも適用する
- `/api/upload`（既存経路）の権限確認（research P3）
- `/api/blob` の `applications/` 以外の権限確認
- AIの案件読み取りの自由項目対応

## Complexity Tracking

開発原則への違反なし。記載不要。
