---

description: "案件ごとの提出項目を応募フォームで受け取る — 作業リスト"
---

# Tasks: 案件ごとの提出項目を応募フォームで受け取る

**Input**: `specs/001-kamite-custom-submissions/` の spec.md・plan.md・research.md・data-model.md・contracts/interfaces.md・quickstart.md

**Tests**: 開発原則 第5条により、判定・検証ロジック（純粋関数）にはユニットテスト（vitest, `src/**/*.test.ts`）を書く。画面・Server Action・DB・外部APIそのもののテストは書かない（quickstart.md の手動確認で担保）

**Organization**: ユーザーストーリー単位。優先度順（P1: US1→US4→US5→US6、P2: US2→US3）

**改訂**: 2026-10-10 analyze 反映（端末側の失敗報告・止まったときの対策・プロフィールは書き戻さない・代理応募はコンポジ不問・自動判定の見直し・再送時の引き継ぎ・未提出カラム・マイグレーションの承認）／analyze 2回目反映（「応募済み」でも別途送る案内を出す・429 は送り直さない）／最終 analyze 反映（コンポジットは回答に保存せず登録済みのものを表示・削除時に自由項目のファイルは消さない・回答は1件ずつ検証・生年月日未登録時の年齢・入力中の項目変更）／再点検反映（代理応募は自由項目の必須を問わない・コンポジ項目の除外を US1 に移動・本人確認できない拒否はDBに記録しない・T029a 追加）

**共通の約束**
- 既存の4種類の提出物（`JobRequirement` / `ApplicationSubmission` / `SubmissionCategory`）のコードは**動きを変えない**。手を入れるのは「横に足す」部分だけ
- **応募フォームからタレントのプロフィールは書き換えない**
- コミットは1機能ずつ。デザイン修正と機能修正を混ぜない（CLAUDE.md）。`vozel-test` への push はユーザーの許可後
- フォームには `noValidate`、HTML標準の `required` 等に依存しない（CLAUDE.md ブラウザ互換性）
- localStorage の読み書きはすべて try/catch で囲み、使えなくても動くようにする
- Prisma CLI は `./node_modules/.bin/prisma` を使う

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 並行して進められる（別ファイル・未完了タスクへの依存なし）
- **[Story]**: どのユーザーストーリーの作業か

---

## Phase 1: Setup

**Purpose**: 作業ブランチ・依存追加・方式が使えるかの検証

- [X] T001 `git fetch` 後、`origin/vozel-test` から作業ブランチ `001-kamite-custom-submissions` を作成する（spec-kit 一式と CLAUDE.md の追記は最初のコミットに含める）
- [X] T002 `fflate` を dependencies に追加する（`package.json` / `package-lock.json`）
- [ ] T003 検証スパイク①: テスト環境のストレージで `createSignedUploadUrl` で発行したURLへ、ブラウザから anon key なしで `XMLHttpRequest` の PUT ができ、`upload.onprogress` が取れるか確認する。できなければ `NEXT_PUBLIC_SUPABASE_ANON_KEY` が必要と記録し、ユーザーにテスト環境への追加を依頼する（結果を research.md R5 に追記）
- [ ] T004 検証スパイク②: `/api/blob?sign=true` で得た署名付きURLをブラウザから `fetch` できるか（CORS）確認する（結果を research.md R8 に追記。不可なら R8 の代替手段で進める）
- [ ] T005 [P] テスト用KAMITE送信スクリプト `scripts/send-test-kamite-job.ts` を作る。`.env.local` の `KAMITE_API_KEY` / `KAMITE_API_SECRET` で `X-Kamite-Timestamp` と `X-Kamite-Signature`（`HMAC-SHA256(secret, "<timestamp>.<本文>")` の16進）を付け、引数で渡したJSONファイルを送る。冒頭に「テスト環境専用・本番へは移植しない」とコメント

---

## Phase 2: Foundational（全ストーリーの前提）

**Purpose**: データの入れ物・形の検証・本人確認（既存の穴 P1/P2 の解消）・失敗記録の土台

**⚠️ ここが終わるまでストーリーの作業に入らない。終わったら既存の応募・代理応募が今までどおり動くことを確認する**

- [ ] T006 `prisma/schema.prisma` に追加する: `Job.submissionFields Json?`、`Application.submissionAnswers Json?`、`Application.hasMissingAnswers Boolean @default(false)`、新モデル `FormErrorLog`（`@@map("form_error_logs")`。列: `id String @id @default(cuid())`、`code String @unique`、`form String`、`talentId String?`、`jobId String?`、`field String?`、`reason String`、`source String`、`message String?`、`userAgent String?`、`occurredAt DateTime`、`createdAt DateTime @default(now())`。外部キーは張らない。`@@index([createdAt])`・`@@index([talentId])`・`@@index([talentId, jobId, field])`）
- [ ] T007 `./node_modules/.bin/prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script` で差分を出し、**T006 の4つ以外が含まれていないことを目視確認**して `prisma/migrations/<日時>_add_submission_fields/migration.sql` を作る。**SQLをユーザーに見せて承認を得てから**テストDBに適用し `_prisma_migrations` に記録、`prisma generate`（開発原則 第3条）
- [ ] T008 [P] `src/lib/submission-fields.ts` を作る:
  - zod `submissionFieldSchema`（`key` 一意、`label` 1〜200文字、`kind` は `PHOTO|FILE|TEXT|URL`、`required` boolean、`note` 0〜1000文字 or null、`autofill` は `NAME|AGE|HEIGHT|COMPOSITE|null`、`autofillOverridden` boolean（既定 false）、`source` は `KAMITE|VOZEL`、配列は最大50。`autofill` が NAME/AGE/HEIGHT で `kind` が TEXT でなければ `null` に落とす）
  - zod `submissionAnswerSchema`（`origin` は `INPUT|PROFILE|DEFERRED|ADMIN`、TEXT は `value` 1〜2000文字、URL は http(s) のURL、PHOTO/FILE は `fileUrl` 必須、DEFERRED は `value`/`fileUrl` とも null で `errorCode`（受付番号の形式）を持つ、`updatedAt` は ADMIN のみ）
  - `parseSubmissionFields(json)` / `parseSubmissionAnswers(json)`（null は空配列。**1件ずつ検証し、形が合わないものだけ外して `logger.warn`**＝1件の不正で全部が見えなくならないようにする）
  - `detectAutofill(label, kind)`（research R2: COMPOSITE は「プロフィール」または「コンポジ」を含む（kind は問わない）。NAME は空白・記号・「お」「ご」を除いた項目名が「名前」「氏名」に一致し kind が TEXT、「保護者・緊急・連絡先・事務所・担当・ふりがな・フリガナ・カナ・ローマ字」を含むものは除外。AGE/HEIGHT は「年齢」「身長」を含み kind が TEXT）
  - `makeKamiteFieldKey(label, index)`（`k_`+項目名ハッシュ、同名は出現順の番号付き）、`makeVozelFieldKey()`（`v_`+ランダム8文字）
  - `mergeKamiteFields(prev, incoming)`（同じ `key` で `autofillOverridden: true` の項目は前の `autofill` を引き継ぐ。それ以外は `detectAutofill`）
  - `hasMissingRequired(fields, answers)`（必須で回答なし or DEFERRED があれば true。`autofill: COMPOSITE` の項目は除く）
- [ ] T009 [P] `src/lib/submission-fields.test.ts`: detectAutofill（「お名前」「氏名」「ご氏名」→NAME、「保護者氏名」「緊急連絡先の氏名」「フリガナ（名前）」「事務所名」→null、「年齢」「身長」、「プロフィール資料」(FILE)・「コンポジ」(PHOTO)・「プロフィール写真」(PHOTO)・「プロフィール」(TEXT)→COMPOSITE、種類違い）、同名項目のキー、再送で同じ項目名なら同じキー、mergeKamiteFields（管理者修正の引き継ぎ・自動判定の再判定・消えた項目・増えた項目）、スキーマの正常系・各必須の欠落・境界値（50/51項目、200/201文字、1000/1001文字、2000/2001文字、http以外のURL）、parseSubmissionAnswers（不正な1件だけ外れて残りは読める）、hasMissingRequired（DEFERRED・任意・COMPOSITE項目）
- [ ] T010 [P] `src/lib/applicant.ts` を作る: 判定部分を純粋関数 `decideApplicant({ session, tokenTalent, formTalentId, formStatus })` に分け（管理者→フォームの talentId と status を採用・`requireResume=false`・`isAdminProxy=true`／タレントセッション→セッションの talentId・status は `APPLIED` 固定・`requireResume=true`・`isAdminProxy=false`／有効トークン（ACTIVE）→トークンの本人・`APPLIED` 固定・`requireResume=true`・`isAdminProxy=false`／どれでもない→拒否）、それを呼ぶ `resolveApplicant(formData)`（`getSession()` と `getTalentByToken(t)` を使う）と、JSON本文用の `resolveRequester({ t, talentId })`（`talentId` は管理者のときだけ採用、タレント・専用リンクのときは無視）を置く
- [ ] T011 [P] `src/lib/applicant.test.ts`: decideApplicant の全分岐（タレントが他人の talentId・status=ACCEPTED を送っても無視される、トークン無効、セッションもトークンもない、管理者は採用され requireResume=false・isAdminProxy=true）
- [ ] T012 `src/lib/actions/application.ts` の `createApplication` 冒頭で `resolveApplicant` を呼び、以降の `data.talentId` / `data.status` を差し替える。拒否時は `{ error: { talentId: ["ログインし直してください"] } }` を返し、**`form_error_logs` には記録せず `logger.warn` にだけ出す**（本人確認できない呼び出しで記録テーブルを埋められないようにする）。`requireResume` が true で応募者の `resume` が空なら拒否（**管理者の代理応募は今までどおりコンポジ不問**。FR-016）。`src/lib/validations/application.ts` は変更しない（既存の管理画面が送る形を維持）
- [ ] T013 `src/components/job-application-form.tsx` と `src/app/(talent)/jobs/[id]/page.tsx`: 専用リンク（`?t=`）で開いたときトークンを hidden の `t` として送る（見た目は変えない）
- [ ] T014 [P] `src/app/api/blob/route.ts`: `extractStoragePath(url)` が `applications/` で始まるときだけ、管理者セッション、または2段目が自分の talentId のタレントセッションでなければ 403。それ以外のパスは変更しない
- [ ] T015 [P] `src/lib/error-code.ts`（サーバー・ブラウザ共用）: `makeErrorCode()` → `E-`+英数6文字（0/O/1/I を除く）、`isErrorCode(s)`。`src/lib/error-code.test.ts` で形式・紛らわしい文字が出ないことを確認
- [ ] T016 [P] `src/lib/form-error-log.ts`: `recordFormError({ code?, form, talentId?, jobId?, field?, reason, source, message?, userAgent?, occurredAt? })` が `form_error_logs` に保存し（`code` 未指定・重複なら `makeErrorCode()` で作り直す）、`logger.warn` にも送って保存した `code` を返す。保存に失敗しても例外を投げない。`reason` は data-model の決まった値だけ、`message` は500文字、`userAgent` は300文字で切る。**入力値・提出物の中身・トークンを受け取る引数を作らない**
- [ ] T017 回帰確認: 今の4種類の提出物を持つ案件にタレントで応募できる／管理画面の代理応募（`src/components/admin/new-application-dialog.tsx`）で選んだタレント・状態で、コンポジットの無いタレントでも応募できる（自由項目のある案件への代理応募は T028 の後に再確認する）／専用リンクから応募できる／管理画面で過去の提出物リンクが開ける。quickstart S3 の本人確認（他人の talentId・status=ACCEPTED・ログアウト状態）が期待どおり

**Checkpoint**: 既存の動きは変わらず、本人確認と提出物ファイルの閲覧制限が効いている

---

## Phase 3: User Story 1 - タレントが応募フォームで提出物を出す (P1) 🎯 MVP

**Goal**: KAMITEの提出物が案件の自由項目として保存され、応募フォームに種類どおりの入力欄で出て、回答が応募に保存される

**Independent Test**: quickstart S1（プロフィール初期値・コンポジ以外の部分）と S6

- [ ] T018 [US1] `src/app/api/external/jobs/route.ts`: `payload.requirements` を `submissionFields` に変換して `jobs` に保存する（`label`/`kind`/`required`/`note`/順番をそのまま、`key`=`makeKamiteFieldKey`、`source`=`KAMITE`）。新規は `detectAutofill`、再送は既存の `submissionFields` と `mergeKamiteFields` で突き合わせて置き換え（`requirements` が空なら `[]`）。既存の応募の `submissionAnswers` には触れない。受け付ける形式・認証・応答は変えない（FR-030）
- [ ] T019 [US1] 同ファイルの `buildNote` から提出物（requirements）の文章を外す（枠 roles と note はそのまま。FR-004）
- [ ] T020 [P] [US1] `src/lib/upload-errors.ts`: `classifyUploadError({ status?, body?, error?, stalled?, aborted? })` → `TOO_LARGE`（413・サイズ超過）/ `BAD_TYPE` / `NETWORK`（XHR の onerror・オフライン）/ `STALLED`（30秒進まない）/ `ABORTED`（タレントが中止）/ `UNAUTHORIZED` / `OTHER` と、タレント向けの文言を返す。応答がJSONでなくても落ちない
- [ ] T021 [P] [US1] `src/lib/upload-errors.test.ts`: 413（本文がHTML）、400 BAD_TYPE、ネットワークエラー、stalled、aborted、401、本文が空
- [ ] T022 [US1] `src/lib/supabase-storage.ts` に `createUploadUrl(path)`（`createSignedUploadUrl` を使う）を追加。既存関数は変更しない
- [ ] T023 [US1] `src/app/api/submissions/upload-url/route.ts`（POST）: `resolveRequester` で本人決定（タレントセッション／本文の `t`／管理者。管理者は本文の `talentId` を採用）、案件の `submissionFields` に `fieldKey` があり種類が PHOTO/FILE で `autofill` が COMPOSITE でないこと、PHOTO は画像形式・FILE は `/api/upload` と同じ許可形式、大きさ100MB以下を確認し、保存先 `applications/{talentId}/{jobId}/{key}-{時刻}.{拡張子}` の署名付きアップロードURLと `fileUrl` を返す。400 の失敗は `recordFormError({ form: "upload", source: "server", ... })` して `{ error, reason, code }` を返す。本人確認できない 401 は記録せず `logger.warn` のみ（contracts §2）
- [ ] T024 [P] [US1] `src/lib/client-upload.ts`（ブラウザ用）: `uploadSubmissionFile({ jobId, fieldKey, file, t, talentId, onProgress, signal })`（`talentId` は管理者が応募詳細で代わりにアップロードするときだけ渡す）が upload-url を取得（15秒で打ち切り）→ PHOTO は長辺2400px の JPEG に縮小（デコードできない HEIC はそのまま）→ 署名付きURLへ `XMLHttpRequest` で PUT（`upload.onprogress` で進み具合を通知、**30秒進まなければ abort して STALLED**、`signal` で中止できる）→ `fileUrl` を返す。失敗は `classifyUploadError` の結果で reject
- [ ] T025 [P] [US1] `src/components/submission-field-input.tsx`: 1項目分の入力欄（項目名・必須/任意・指示文、PHOTO は `accept="image/*"`（カメラ・ライブラリ両方を選べる）、FILE は既存と同じ形式、TEXT は複数行入力、URL は `inputMode="url"`）。アップロード中（進み具合％と「中止」ボタン）・完了（ファイル名と「削除」）・エラー表示の状態を持つ
- [ ] T026 [US1] `src/app/(talent)/jobs/[id]/page.tsx`: `job.submissionFields` を `parseSubmissionFields` して `autofill !== "COMPOSITE"` の項目をフォームへ渡す（`getOpenJob` の select に `submissionFields` を追加: `src/lib/actions/job.ts`）
- [ ] T027 [US1] `src/components/job-application-form.tsx`: 既存の4種類の欄の**下に**自由項目の欄を並び順どおりに表示し、`ans_{key}_value` / `ans_{key}_fileUrl` / `ans_{key}_fileName` を送る。応募ボタンの活性条件に自由項目の必須を加える（既存の4種類の部分のコード・見た目は変えない）
- [ ] T028 [US1] `src/lib/actions/application.ts` の `createApplication`: 案件の `submissionFields` を読み、**`autofill: COMPOSITE` の項目は最初から対象外にする**（必須チェック・`fieldKeys` の突き合わせ・回答の作成のどれにも含めない。フォームに出さないため。analyze A2）。**`isAdminProxy` のとき（管理者の代理応募）は、自由項目の必須チェックと `fieldKeys` の突き合わせをせず、回答なし（`submissionAnswers` は空）で応募を作り、`hasMissingAnswers` を `hasMissingRequired(fields, [])` で設定する**（代理応募の画面に自由項目の入力欄が無いため。今の4種類の必須チェックは今までどおり。analyze A1）。タレント本人・専用リンクのときは、フォームの `ans_*` から回答を組み立てて `submissionAnswerSchema` で検証（PHOTO/FILE の `fileUrl` は `applications/{応募者のtalentId}/{この案件のjobId}/` 配下であること）、必須の欠落は項目キーごとのエラーで返す。**フォームが送ってきた項目キーの組と案件の今の項目が食い違うとき**（入力中にKAMITE再送・管理者の編集で項目が変わった）は、項目ごとのエラーではなく `{ message: "案件の内容が更新されました。画面を開き直してください", action: "RELOAD" }` を返し、`recordFormError({ reason: "FIELDS_CHANGED" })` する（フォームは送信時に、表示していた項目キーの一覧を hidden `fieldKeys` で送る）。`origin: "INPUT"` で `applications.submissionAnswers` に保存（回答時点の `label`/`kind` を控える）し、`hasMissingAnswers` を `hasMissingRequired` の結果で保存
- [ ] T029 [US1] 削除処理の確認（FR-031・コードは変更しない）: 自由項目の回答がある応募を `deleteApplication`・`bulkDeleteApplications` で削除、そのタレントを `deleteTalent` で削除しても、今までどおり成功し、既存の提出物・宣材写真・コンポジットのファイルは今までどおり消え、自由項目のファイルはストレージに残ることを確認する
- [ ] T029a [US1] 代理応募の確認: 必須の自由項目があるKAMITE案件に、管理画面の代理応募（`new-application-dialog.tsx`）で応募できる（エラーにも「開き直してください」にもならない）。作られた応募は「未提出あり」になる。必須のコンポジ項目がある案件にタレントで応募できる（画面にない項目が足りないと言われない）
- [ ] T030 [P] [US1] `EXTERNAL_JOB_API.md`: 「枠（roles）と提出物（requirements）は jobs.note に文章で入る」を「提出物は案件の提出項目として応募フォームに出る（note には入らない）」に更新し、kind ごとの入力欄と、項目名による自動判定（名前・年齢・身長・コンポジ）の決め方を追記

**Checkpoint**: KAMITE案件に提出物つきで応募でき、回答がDBに入る（管理画面での表示は US4）

---

## Phase 4: User Story 4 - 管理画面で項目ごとに見て、写真をまとめてダウンロードする (P1)

**Goal**: 応募詳細の画面で自由項目の回答を項目順に見られ、写真を応募単位でZIPにできる

**Independent Test**: quickstart S2

- [ ] T031 [US4] `src/lib/actions/application-detail.ts`: `getApplicationDetail(id)`（`requireAdmin()`。応募・タレント名・タレントの今の `resume`・案件名と `submissionFields`・`submissionAnswers`・既存の `submissions` を返す）
- [ ] T032 [P] [US4] `src/lib/submission-fields.ts` に `buildAnswerRows(fields, answers)`（案件の項目順に並べ、`autofill: COMPOSITE` の項目は「コンポジット（登録済みのもの）」の行、未回答は「未提出」、DEFERRED は「別途送付待ち」、案件から消えた項目の回答は末尾に「（現在の案件にない項目）」として回答時点の項目名で出す）と `zipEntryNames(talentName, rows)`（`{タレント名}_{項目名}.{拡張子}`、ファイル名に使えない文字は `_`、同名は `_2` `_3`）を追加し、`src/lib/submission-fields.test.ts` にテストを追加
- [ ] T033 [P] [US4] `src/components/admin/application-answers.tsx`: 行ごとに項目名・回答（PHOTO はサムネイル＝`blobProxyUrl`、FILE はリンク、TEXT はそのまま、URL はリンク）と出どころの印（プロフィールから／管理者が登録）を表示
- [ ] T034 [P] [US4] `src/components/admin/photo-zip-button.tsx`: PHOTO の回答の署名付きURLを `/api/blob?sign=true` で取得 → ブラウザで取得 → `fflate` で ZIP → `{タレント名}_{案件名}_写真.zip` でダウンロード。写真がなければボタンを出さない。取得に失敗した写真は個別ダウンロードのリンクに切り替える（research R8）
- [ ] T035 [US4] `src/app/(admin)/admin/applications/[id]/page.tsx`（+ `loading.tsx`）: 基本情報・自由項目の回答（T033）・既存の提出物（既存の `SubmissionLinks` をそのまま使う）・ZIPボタン（T034）
- [ ] T036 [US4] 「内容を見る」リンクを追加: `src/components/admin/application-table.tsx` と `src/app/(admin)/admin/jobs/[id]/page.tsx` の応募者欄（既存の列・表示は変えない）

**Checkpoint**: US1 + US4 で山中さんの個別回収が不要になる（MVP）

---

## Phase 5: User Story 5 - VOZELの案件でも提出項目を自由に足せる (P1)

**Goal**: 管理画面の案件編集で自由項目を足す・直す・消す・並べ替える・自動判定を直す。何も足さなければ今と同じ

**Independent Test**: quickstart S5

- [ ] T037 [P] [US5] `src/components/admin/submission-fields-editor.tsx`: 項目の追加（項目名・種類・必須・指示文）・編集・削除・上下移動、`autofill` の選択（自動判定の結果を初期値に表示し、管理者が「なし／名前／年齢／身長／コンポジ」で変更できる。変更したら `autofillOverridden: true`）。中身を JSON にして hidden `submissionFields` で送る。KAMITE由来の項目は `source` と `key` を保ったまま編集できる
- [ ] T038 [US5] `src/components/admin/job-editor-form.tsx`: 既存の「提出物」（4種類）セクションの**下に** T037 を置く（既存セクションは変更しない）。`src/components/admin/job-edit-sheet.tsx` と案件詳細から `submissionFields` を渡す
- [ ] T039 [US5] `src/lib/actions/job.ts` の `createJob` / `updateJob`: hidden `submissionFields` を `submissionFieldSchema` で検証して保存（新しい項目の `key` は `makeVozelFieldKey`、`autofill` 未指定なら `detectAutofill`、`source` 未指定は `VOZEL`）。送られてこない（既存の編集画面からの保存など）場合は**触らない**。既存の `extractRequirements` の処理は変えない
- [ ] T040 [US5] 回帰確認: 4種類だけの案件の作成・編集・応募・管理画面表示が今までどおり／この機能より前の案件を編集して保存しても `submissionFields` が null のまま／KAMITE案件を管理画面で編集して保存しても項目が失われない

**Checkpoint**: VOZEL・KAMITE どちらの案件でも自由項目が使える

---

## Phase 6: User Story 6 - エラーが出ても入力が消えず、原因が追え、止まらない (P1)

**Goal**: 項目の場所でエラーが分かる・入力が消えない・止まっても操作が戻る・端末側の失敗も記録される・アップロード失敗は「あとで別途送る」で応募できる・管理者が未提出を把握して後から登録できる

**Independent Test**: quickstart S7

- [ ] T041 [US6] `src/app/api/form-errors/route.ts`（POST）: `resolveRequester` で本人確認（なければ 401・記録しない）、同じタレントの直近10分の `form_error_logs` が30件以上なら 429（記録しない）、1回最大20件、`reason` は決まった値だけ、`talentId` は本文から受け取らず本人確認の結果を使う、`userAgent` はヘッダーから。各件を `recordFormError({ source: "client", code, occurredAt, ... })` で保存し、保存した `code` の一覧を返す（contracts §2b）
- [ ] T042 [P] [US6] `src/lib/client-error-report.ts`（ブラウザ用）: `reportClientError({ form, jobId, field, reason, message, t })` が `makeErrorCode()` で受付番号をその場で作って返し、`/api/form-errors` へ送る（`keepalive: true`）。通信できなかった・5xx の分は localStorage `form-error-queue` にためて（最大50件、古いものから捨てる）、`flushErrorQueue(t)` で送り直す。**429・401 を受けた分は送り直さずに捨てる**。サーバーが番号を作り直したら差し替えた番号を通知する。送り直すかどうかの判定は純粋関数 `shouldRetryReport(result)`（通信エラー・5xx → true、200・4xx → false）に分け、`src/lib/client-error-report.test.ts` でテストする（開発原則 第5条）
- [ ] T043 [US6] `src/lib/client-upload.ts` と `src/components/submission-field-input.tsx`: アップロード失敗（STALLED・NETWORK・TOO_LARGE・BAD_TYPE 等。ABORTED は報告しない）で `reportClientError` を呼び、項目の場所に理由・受付番号・「もう一度アップロード」を表示。PHOTO/FILE は加えて「あとで別途送る」を表示。入力値・アップロード済みファイルは保持
- [ ] T044 [US6] `src/lib/actions/application.ts` の `createApplication`: エラーを項目キーごとの `{ error: { [field]: string[] }, message, action: "FIX_FIELDS" | "RETRY" | "CONTACT", code? }` で返す（既存の `error` の形＝値が文字列配列のオブジェクトは維持）。サーバー側の例外は `recordFormError({ form: "application", source: "server", reason: "SERVER_ERROR" })` して `action: "RETRY"` と受付番号を返す。検証エラーも項目ごとに記録。タレント本人・専用リンクからの送信で既に応募済みなら `{ success: true, alreadyApplied: true, deferred: [{ label, code }] }`（既存の応募の DEFERRED 項目の `label` と `errorCode`）を返す
- [ ] T045 [US6] 「あとで別途送る」: `createApplication` で `ans_{key}_deferred=1` を受けたら、その応募者・案件・項目の `form_error_logs`（`form: "upload"`、`source` は問わない）があるときだけ `origin: "DEFERRED"` として受け付け（`ans_{key}_deferred_code` の受付番号を `errorCode` に保存。形式が不正なら記録の `code` を使う）、必須を満たしたものとして扱う（`hasMissingAnswers` は true のまま）。記録がなければ未入力扱い。成功時に `{ success: true, deferred: [{ label, code }] }` を返す（contracts §4）
- [ ] T046 [US6] 応募の送信が止まったとき: `src/lib/actions/application.ts` に `getMyApplicationStatus(jobId, t?)`（タレントセッション・専用リンクで本人確認、本人の応募の有無を返す）を追加。`src/components/job-application-form.tsx` で、送信前に `flushErrorQueue` を呼び（「別途送る」の確認に端末側の記録を間に合わせるため）、送信は30秒で待つのをやめて `getMyApplicationStatus` で確認 → 応募済みなら完了表示（`getMyApplicationStatus` も既存の応募の DEFERRED 項目の `label`・`errorCode` を返し、別途送る案内を出す）、未完了なら入力を残して「もう一度送信」と受付番号（`reportClientError` で `reason: "TIMEOUT"`）を表示。送信中はボタンを無効にする
- [ ] T047 [US6] `src/components/job-application-form.tsx`: 応募時のエラーは各項目の下に出し、最初のエラー項目へスクロール（`scrollIntoView`）。完了表示で、`deferred` があれば「次の項目は管理者に別途送ってください：{項目名}（受付番号：{code}）」、`action: "RETRY"` / `"CONTACT"` のときは次に何をすればよいかを表示。`action: "RELOAD"` のときは「案件の内容が更新されました」と「開き直す」ボタンを出す（入力は途中保存から戻る）
- [ ] T048 [P] [US6] `src/lib/apply-draft.ts`（ブラウザ用）: `loadDraft/saveDraft/clearDraft(talentId, jobId)`。localStorage キー `apply-draft:{talentId}:{jobId}`、TEXT/URL の値とアップロード済み `fileUrl`/`fileName` だけを保存。フォームから入力のたびに保存（間引き）、開いたときに復元、応募完了で削除。**応募済みの案件を開いたときも削除**（`src/app/(talent)/jobs/[id]/page.tsx` から応募済みかを渡す）
- [ ] T049 [US6] `src/app/(admin)/admin/error-logs/page.tsx`: 直近の失敗記録の一覧（起きた日時・受付番号・フォーム・タレント名・案件名・項目名・理由・サーバー/端末・端末情報）、受付番号での検索、フォーム・タレント・案件での絞り込み。`requireAdmin()`。管理画面のナビに追加
- [ ] T050 [US6] 「未提出あり」: `src/lib/actions/application.ts` の一覧取得（`getApplications`・`getApplicationCount`）に `hasMissingAnswers` の絞り込みを追加し、`src/components/admin/application-table.tsx` と案件詳細の応募者欄に印を表示、**絞り込みは応募管理一覧にだけ**「未提出ありのみ」を追加（既存の列・並び順・ページ分けは変えない）
- [ ] T051 [US6] 管理者による回答の登録・修正: `src/lib/actions/application-detail.ts` に `updateApplicationAnswer(applicationId, key, { value?, fileUrl?, fileName? })`（`requireAdmin()`、案件の項目に従って検証、`origin: "ADMIN"`・`updatedAt` を記録、`hasMissingAnswers` を再計算。差し替えた古いファイルは消さない＝FR-031 と同じ扱い。`autofill: COMPOSITE` の項目は登録・修正の対象外）。`src/components/admin/application-answers.tsx` に各行の「登録／差し替え／修正」を追加（ファイルは T024 を管理者として使い upload-url 経由で直接アップロード）。`DEFERRED` の行は「別途送付待ち」と目立つ表示

**Checkpoint**: アップロードや送信で止まっても操作が戻り、応募は完了でき、管理者が未提出と失敗の原因を把握できる

---

## Phase 7: User Story 2 - 名前・年齢・身長はプロフィールから最初から埋まっている (P2)

**Goal**: NAME/AGE/HEIGHT の項目にプロフィールの値を初期表示する。**プロフィールは書き換えない**

**Independent Test**: quickstart S1 のプロフィール部分

- [ ] T052 [P] [US2] `src/lib/submission-fields.ts` に `profileInitialValue(autofill, talent, today)`（NAME=名前、AGE=生年月日から today 時点の満年齢、HEIGHT=身長（cm を付けない数字）、未登録は空）を追加し、テストを追加（誕生日当日・前日・うるう日、生年月日・身長の未登録）
- [ ] T053 [US2] `src/app/(talent)/jobs/[id]/page.tsx`: タレントの `name`・`birthDate`・`height` を読み（専用リンクの場合も同様）、NAME/AGE/HEIGHT 項目の初期値をフォームへ渡す
- [ ] T054 [US2] `src/components/submission-field-input.tsx`: プロフィールから埋めた項目に「プロフィールの内容を入れています。この応募だけ変えたい場合は書き換えてください（プロフィールは変わりません）」を表示。AGE は書き換え不可＋「年齢は生年月日から計算しています。違う場合は設定画面で生年月日を直してください」（設定画面へのリンク）。**生年月日が未登録なら AGE は普通の入力欄**にし、「設定画面で生年月日を登録すると次から自動で入ります」を表示
- [ ] T055 [US2] `src/lib/actions/application.ts` の `createApplication`: NAME/AGE/HEIGHT の回答は、受け付け側で `profileInitialValue` と比べて同じなら `origin: "PROFILE"`、違えば `INPUT` として保存する。AGE は、生年月日が登録されていればフォームの値を使わず受け付け側で計算した値を保存し（`PROFILE`）、未登録ならフォームの値を使う（`INPUT`）。**タレントのプロフィールは更新しない**

**Checkpoint**: 名前・年齢・身長は手入力不要。プロフィールは変わらない

---

## Phase 8: User Story 3 - 「プロフィール」「コンポジ」はコンポジットを自動で付ける (P2)

**Goal**: COMPOSITE 項目はフォームに出さず、応募詳細でタレントに登録済みのコンポジットを表示する。**コンポジットの仕組みと保存先には手を入れない・回答に保存しない**

**Independent Test**: quickstart S1 の「プロフィール資料」・S2・S4

- [ ] T056 [US3] 確認（コード変更は T028・T008 で済んでいる）: `autofill: "COMPOSITE"` の項目について、開発ツールで `ans_{key}_value` 等を送っても回答が作られない／必須チェック・`hasMissingAnswers` に影響しない／upload-url を発行できない（T023）
- [ ] T057 [US3] `src/components/admin/application-answers.tsx`: COMPOSITE の行は「コンポジット（登録済みのもの）」として、T031 で取得したタレントの今の `resume` を、既存のコンポジット表示と同じ方法（`blobProxyUrl(resume, true)`）でリンク表示する。未登録なら「コンポジット未登録」。ZIP（T034）・管理者の登録/修正（T051）の対象外
- [ ] T058 [US3] 確認: コンポジット未登録のタレントで応募ボタンが押せず案内が出る（既存）／画面を通さず送っても拒否される（T012）／代理応募は今までどおりできる／管理画面のコンポジット生成・アップロード・表示（`composite-pdf-button.tsx`）が今までどおり動く

**Checkpoint**: 全ストーリー完了

---

## Phase 9: Polish & 確認

- [ ] T059 [P] `CLAUDE.md` の「踏んだ罠」に追記: Vercel Functions の本文上限4.5MB（`/api/upload` 経由は大きい写真が落ちる・Safari では「The string did not match the expected pattern.」になる）、提出物は upload-url で直接アップロード、`/api/blob` は `applications/` だけ権限確認あり、`submissionFields`/`submissionAnswers` は必ず `src/lib/submission-fields.ts` を通して読む、応募フォームからプロフィールは書き換えない
- [ ] T060 `npm test` と `npx tsc --noEmit` が通る
- [ ] T061 quickstart.md の S1〜S8 をテスト環境で実施（S8 は iPhone Safari・LINE内蔵ブラウザ・Android Chrome の実機。実機確認できなかったものは未確認として報告）
- [ ] T062 ユーザーの許可を得て `vozel-test` へ push → 山中さんにテスト環境で確認してもらう（SC-008）。項目名の自動判定語を山中さんの実データで調整
- [ ] T063 （本番反映はユーザーの許可後・別作業）`origin/main` から新しいブランチを切り、本機能のファイルだけ移植（`scripts/send-test-kamite-job.ts` は除く）、`git diff origin/main..HEAD --stat` を確認。本番DBのマイグレーションは Supabase SQL Editor でユーザーに実行してもらい `_prisma_migrations` に記録（開発原則 第1条・第3条）

---

## Dependencies & Execution Order

- **Setup（T001〜T005）** → **Foundational（T006〜T017）** → 各ストーリー
- **US1（T018〜T030）**: Foundational 後すぐ。MVP の中心
- **US4（T031〜T036）**: US1 の回答データがあると確認しやすい（コードは US1 と並行可）
- **US5（T037〜T040）**: Foundational 後に独立して可（T008 の関数に依存）
- **US6（T041〜T051）**: US1（T023・T024・T025・T027・T028）と US4（T031・T033）に依存。T043 は T042、T045 は T041・T043、T046 は T042 に依存
- **US2（T052〜T055）**: US1 の T025・T028 に依存
- **US3（T056〜T058）**: US1 の T028、US4 の T031・T033 に依存（コンポジ項目を対象外にする処理は US1 の T028 に含まれる）
- **Polish（T059〜T063）**: 全ストーリー後

同じファイルを触るため順番に行うもの: `createApplication`（T012 → T028 → T044 → T045 → T055）、`job-application-form.tsx`（T013 → T027 → T046 → T047）、`submission-field-input.tsx`（T025 → T043 → T054）、`application-answers.tsx`（T033 → T051 → T057）

## Parallel Example

```text
# Foundational の並行
T008+T009 submission-fields ／ T010+T011 applicant ／ T014 /api/blob ／ T015 error-code ／ T016 form-error-log

# US1 の並行
T020+T021 upload-errors ／ T024 client-upload ／ T025 submission-field-input ／ T030 EXTERNAL_JOB_API.md

# US4 の並行
T032 buildAnswerRows/zipEntryNames ／ T033 application-answers ／ T034 photo-zip-button
```

## Implementation Strategy

1. **Setup + Foundational** → T017 で既存が壊れていないことを確認（ここで一度区切ってよい：本人確認の穴だけ先に本番に出す判断もできる）
2. **MVP = US1 + US4** → テスト環境で KAMITE 案件の提出物が集まり、管理画面で見られる
3. **US6** → エラー対策・止まったときの対策・「あとで別途送る」（山中さんに触ってもらう前に入れる）
4. **US5・US2・US3** → 仕上げ
5. **T061〜T062** → 山中さんの確認 → 許可後に本番（T063）
