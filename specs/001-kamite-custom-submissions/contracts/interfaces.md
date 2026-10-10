# Contracts: 案件ごとの提出項目を応募フォームで受け取る

## 1. KAMITE受け口 `POST /api/external/jobs`（形式は変更なし）

受け付ける本文・認証・応答は `EXTERNAL_JOB_API.md` のまま。**変わるのは保存のしかただけ**。

| 受け取る値 | 今 | これから |
|---|---|---|
| `requirements[].label` | note に文章で入る | `submissionFields[].label` |
| `requirements[].kind` | 〃 | `submissionFields[].kind` |
| `requirements[].required` | 〃 | `submissionFields[].required` |
| `requirements[].note` | 〃 | `submissionFields[].note` |
| （配列の順番） | 〃 | `submissionFields` の順番 |
| — | — | `key` = `k_` + 項目名ハッシュ、`autofill` = `detectAutofill()`（同じ `key` で管理者が直したものは引き継ぐ）、`source` = `KAMITE` |

`EXTERNAL_JOB_API.md` の「枠（roles）と提出物（requirements）は jobs.note に文章で入る」の記述を「提出物は応募フォームの項目になる」に更新する。

## 2. 提出物アップロードURLの発行 `POST /api/submissions/upload-url`（新設）

**認証**: タレントセッション、専用リンクのトークン（本文の `t`）、管理者セッションのいずれか。どれもなければ 401。

リクエスト（JSON）:
```json
{ "jobId": "cm...", "fieldKey": "k_3fa9c1", "fileName": "IMG_0012.HEIC", "contentType": "image/heic", "size": 3481233, "t": null, "talentId": null }
```
`fieldKey` が `autofill: COMPOSITE` の項目なら 400（`UNKNOWN_FIELD`）。
`talentId` は管理者が応募詳細で代わりにアップロードするときだけ使う（タレント・専用リンクからの値は無視）。

確認すること:
- 案件が存在し、その `submissionFields` に `fieldKey` があり、種類が PHOTO / FILE であること
- PHOTO なら画像の形式、FILE なら既存の `/api/upload` と同じ許可形式であること
- 大きさが上限以下であること（既存と同じ100MB。Supabaseのバケット上限が小さければそちらに合わせる）

応答 200:
```json
{ "uploadUrl": "https://...supabase.co/storage/v1/object/upload/sign/talent-files/applications/...?token=...", "fileUrl": "https://...supabase.co/storage/v1/object/talent-files/applications/{talentId}/{jobId}/k_3fa9c1-1760000000000.jpg" }
```

エラー: 400 `{ "error": "...", "reason": "BAD_TYPE" | "TOO_LARGE" | "UNKNOWN_FIELD" }` / 401 `{ "reason": "UNAUTHORIZED" }`。400 は `form_error_logs` に記録。401（本人確認ができない）は記録せず `logger.warn` にだけ出す。

ブラウザは `uploadUrl` へ `XMLHttpRequest` で PUT する。進み具合を表示し、**30秒進まなければ中止**（`reason: "STALLED"`）。この発行自体は15秒で打ち切る。

## 2b. 端末で起きた失敗の報告 `POST /api/form-errors`（新設）

**認証**: タレントセッション、専用リンクのトークン（本文の `t`）、管理者セッションのいずれか。どれもなければ 401（記録しない）。

**回数制限**: 同じタレントから直近10分に30件まで（`form_error_logs` の件数で判定）。超えたら 429（記録しない）。

リクエスト（JSON）— 1回で複数件送れる（端末にためていた分をまとめて送るため。最大20件）:
```json
{ "t": null, "errors": [
  { "code": "E-7K2X9Q", "form": "upload", "jobId": "cm...", "field": "k_3fa9c1", "reason": "STALLED", "message": "30秒進まなかった", "occurredAt": "2026-10-10T12:34:56.000Z" }
] }
```
- `talentId` は受け取らない（本人確認の結果を使う）。`userAgent` はリクエストヘッダーから取る
- `reason` は決まった値だけ受け付ける。`message` は500文字で切る。**入力値・ファイルの中身は受け取る項目を作らない**

応答 200: `{ "saved": [{ "code": "E-7K2X9Q" }] }` — 受付番号が重複していた場合はサーバーで作り直した番号を返し、端末は表示中の番号を差し替える

429（回数制限）を受けた報告は、端末は送り直さずに捨てる（受付番号は画面に出ているので困らない）。401 も送り直さない。送り直すのは通信できなかった場合と 5xx だけ

## 2c. 応募が完了しているかの確認 `getMyApplicationStatus(jobId, t?)`（Server Action・新設）

応募の送信が30秒で終わらなかったときに画面から呼ぶ。本人確認（タレントセッション・専用リンク）をし、その案件への本人の応募があれば `{ applied: true, deferred: [{ label, code }] }`（その応募の DEFERRED 項目）、なければ `{ applied: false }`。管理者からは呼ばない。

## 3. ファイル配信 `GET /api/blob`（権限確認を追加）

- パスが `applications/` で始まるときだけ: 管理者セッション、または `applications/{自分のtalentId}/...` のタレントセッションでなければ 403
- それ以外のパスは今のまま（変更なし）

## 4. 応募の送信 `createApplication(formData)`（Server Action・既存を拡張）

追加で受け取る値:
| キー | 中身 |
|---|---|
| `t` | 専用リンクで開いた場合のトークン |
| `ans_{key}_value` | TEXT / URL の回答 |
| `ans_{key}_fileUrl` / `ans_{key}_fileName` | PHOTO / FILE の回答 |
| `ans_{key}_deferred` | `1` のとき「あとで別途送る」。受け付け側で、その応募者・案件・項目のアップロード失敗の記録があるかを確かめ、無ければ未入力として扱う |
| `ans_{key}_deferred_code` | 「あとで別途送る」の項目で端末が表示した受付番号 |
| `fieldKeys` | フォームが表示していた自由項目のキーの一覧（案件の項目が入力中に変わったかの確認用） |

応答（成功時）: `{ "success": true, "deferred": [{ "label": "近影写真（正面）", "code": "E-7K2X9Q" }] }` — `deferred` があれば完了画面で「管理者に別途送ってください」と受付番号を表示する。`ans_{key}_deferred_code` で端末が表示した受付番号を受け取り、DEFERRED の回答の `errorCode` に保存する

既存のキー（`talentId` / `jobId` / `status` / `sub_{category}_*`）はそのまま受け取る。ただし `talentId` と `status` を採用するのは管理者セッションのときだけ（research R4）。コンポジットの確認はタレント本人・専用リンクのときだけ（代理応募は今までどおり）。**プロフィールは書き換えない。**

**管理者の代理応募**では、自由項目の必須チェックと `fieldKeys` の確認をしない。`ans_*` は送られてこない前提で、回答なし（`submissionAnswers` は空）・`hasMissingAnswers` は案件の必須の自由項目に応じて設定して応募を作る。今の4種類の必須チェックは今までどおり。

`autofill: COMPOSITE` の項目は、どの経路でも必須チェック・`fieldKeys` の突き合わせ・回答の作成の対象外（フォームに出さないため）。

本人確認ができずに拒否した場合は `form_error_logs` に記録せず、`logger.warn` にだけ出す。

タレント本人・専用リンクからの送信で「既に応募済み」になった場合（止まった後の再送など）は、エラーではなく `{ "success": true, "alreadyApplied": true, "deferred": [{ "label": "近影写真（正面）", "code": "E-7K2X9Q" }] }` を返す（`deferred` は既存の応募の DEFERRED 項目。無ければ空）。

応答（エラー時）— 既存の形を保ったまま項目キーを足す:
```json
{ "error": { "ans_k_3fa9c1": ["最寄駅を入力してください"] }, "message": "入力内容を確認してください", "action": "FIX_FIELDS" }
```
`action`: `FIX_FIELDS`（直す項目がある）/ `RETRY`（時間をおいて再送）/ `CONTACT`（運営へ連絡）/ `RELOAD`（入力中に案件の項目が変わった。画面を開き直す）

## 5. 管理画面（新規画面）

- `/admin/applications/[id]` — 応募の内容（自由項目の回答・既存の提出物・基本情報）、写真の一括ダウンロード、回答の登録・差し替え・修正（`updateApplicationAnswer(applicationId, key, …)`・`requireAdmin()`。ファイルは管理者として upload-url を発行して直接アップロード）
- `/admin/error-logs` — 失敗の記録の一覧（直近、受付番号・フォーム・タレント・案件で検索・絞り込み）
- 応募管理一覧・案件詳細の応募者欄 — 「未提出あり」の印。絞り込みは応募管理一覧だけ（`applications.hasMissingAnswers` を使う）

どちらも `/admin` 配下なので middleware の管理者確認が効く。ページ・データ取得の両方で `requireAdmin()` も呼ぶ。
