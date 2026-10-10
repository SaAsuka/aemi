# Data Model: 案件ごとの提出項目を応募フォームで受け取る

既存のテーブル・カラムは**変更しない**。追加は「カラム3つ（空または既定値あり）」と「新テーブル1つ」だけ。

## 1. `jobs.submissionFields`（追加・Json?・既定 null）

案件の自由項目の定義。配列の順番＝表示順。`null` と `[]` はどちらも「自由項目なし」。

```jsonc
[
  {
    "key": "k_3fa9c1",          // 項目ID。KAMITE: k_+項目名ハッシュ / 管理画面: v_+ランダム8文字
    "label": "最寄駅",           // 項目名（1〜200文字）
    "kind": "TEXT",             // PHOTO | FILE | TEXT | URL
    "required": true,
    "note": "路線名も書いてください", // 指示文（0〜1000文字、null可）
    "autofill": null,           // NAME | AGE | HEIGHT | COMPOSITE | null（保存時に確定・管理画面で変更可）
    "autofillOverridden": false, // 管理者が autofill を手で直したら true。KAMITE再送でも引き継ぐ
    "source": "KAMITE"          // KAMITE | VOZEL
  }
]
```

**ルール**（zod `submissionFieldsSchema` で検証）
- 最大50項目。`key` は配列内で一意
- `autofill` が `NAME` / `AGE` / `HEIGHT` のときは `kind` が `TEXT` であること（違えば保存時に `null` に落とす）
- `autofill` が `COMPOSITE` の項目はタレントのフォームに出さない
- 写真・ファイルは1項目1ファイル
- KAMITE再送時: 同じ `key` で `autofillOverridden: true` の項目は、前の `autofill` を引き継ぐ。それ以外は `detectAutofill()` で再判定

## 2. `applications.submissionAnswers`（追加・Json?・既定 null）

応募の自由項目への回答。**出した項目だけ**入れる（未提出は「案件の項目にあって回答にない」で判断）。

```jsonc
[
  {
    "key": "k_3fa9c1",
    "label": "最寄駅",            // 回答時点の控え
    "kind": "TEXT",              // 回答時点の控え
    "value": "渋谷駅",            // TEXT / URL の回答（それ以外は null）
    "fileUrl": null,             // PHOTO / FILE の保存先URL（それ以外は null）
    "fileName": null,            // 元のファイル名（表示・ZIP用）
    "origin": "INPUT",           // INPUT | PROFILE | DEFERRED | ADMIN
    "errorCode": null,           // DEFERRED のときだけ: タレントに表示した受付番号
    "updatedAt": null            // 管理者が登録・修正した日時（ADMIN のときのみ）
  }
]
```

- `PROFILE`: プロフィールから埋めた初期値のまま送られた回答。書き換えて送られたら `INPUT`。**どちらの場合もプロフィールは書き換えない**
- `autofill: COMPOSITE` の項目には**回答を作らない**（フォームからも受け取らない）。応募詳細では表示時にタレントの今の `resume` を出す。コンポジットの仕組みには手を入れない
- `DEFERRED`（あとで別途送る）: `value` / `fileUrl` は null、`errorCode` にそのとき表示した受付番号を持つ。PHOTO / FILE の項目で、その応募者・案件・項目のアップロード失敗が `form_error_logs` に記録されている場合だけ受け付ける。端末側の失敗は `POST /api/form-errors` で記録される。**完全な防止ではなく手間を増やすだけの仕組み**（タレントが自分で失敗を報告すれば通れる）。管理者側には「未提出あり」で必ず出る
- 「応募済み」で完了した再送の返事では、既存の応募の `DEFERRED` 項目の `label` と `errorCode` を返す（別途送る案内を出し直すため）
- `ADMIN`: 管理者が応募詳細で登録・修正した回答。`DEFERRED` を管理者が埋めると `ADMIN` に置き換わる

**ルール**（zod `submissionAnswersSchema`）
- `kind` が TEXT: `value` 1〜2000文字 / URL: `value` が http(s) のURL / PHOTO・FILE: `fileUrl` 必須（DEFERRED を除く）
- `PHOTO` / `FILE` の `fileUrl` は、受け付け時に「`applications/{応募者のtalentId}/{この案件のjobId}/` 配下であること」を確認（他人のファイル・別の案件用のファイル・任意URLの差し込み防止）

## 3. `applications.hasMissingAnswers`（追加・Boolean・既定 false）

必須の自由項目（`autofill: COMPOSITE` の項目は除く）に「回答なし」または `DEFERRED` が1つ以上あれば true。応募の作成時と、管理者が回答を登録・修正したときに `hasMissingRequired()` で更新する。管理者の代理応募は自由項目の回答なしで作られるので、必須の自由項目がある案件なら true になる。応募管理一覧の「未提出あり」の印・絞り込みに使う（一覧はDBでページ分けしているため、JSONを読んだ後では絞り込めない）。

## 4. `form_error_logs`（新テーブル）

| カラム | 型 | 説明 |
|---|---|---|
| id | String (cuid) | |
| code | String (unique) | タレントに表示する受付番号（`E-` + 英数6文字、紛らわしい 0/O/1/I を除く）。端末で作って送られる。重複時はサーバーで作り直す |
| form | String | `application` / `upload` / （将来）`register` |
| talentId | String? | 分かれば。外部キーは張らない（タレント削除後も記録を残すため） |
| jobId | String? | 分かれば。外部キーなし |
| field | String? | 失敗した項目の `key` |
| reason | String | 次の値のどれか（これ以外は受け付けない）: `REQUIRED_MISSING` / `INVALID_VALUE` / `TOO_LARGE` / `BAD_TYPE` / `NETWORK` / `STALLED` / `TIMEOUT` / `UNAUTHORIZED` / `FIELDS_CHANGED` / `SERVER_ERROR` / `OTHER` |
| source | String | `server`（サーバーで記録）/ `client`（端末から報告） |
| message | String? | 人が読む説明（500文字まで） |
| userAgent | String? | 端末・ブラウザ（LINE内蔵ブラウザの判別用。300文字まで） |
| occurredAt | DateTime | 失敗が起きた日時（端末からの報告は端末の時刻。後から送られることがあるため） |
| createdAt | DateTime | 記録した日時 |

インデックス: `createdAt`、`talentId`、`(talentId, jobId, field)`（「別途送る」の確認用）。**入力値・提出物の中身・パスワード・トークンは保存しない。**

## 5. 既存のまま変えないもの

- `JobRequirement` / `ApplicationSubmission` / `SubmissionCategory`（今の4種類）
- `talents`（応募フォームの初期値として名前・生年月日・身長を読むだけ。書き換えない）
- `talents.resume`（応募詳細でコンポジ項目の表示に読むだけ。回答には保存しない）
- 削除処理（`deleteTalent`・`deleteApplication`・`bulkDeleteApplications`）。自由項目のファイルは削除時も消さず、ストレージに残る

## 状態の流れ

```
KAMITE送信 / 管理画面で保存
   └─ detectAutofill()（管理者が直したものは引き継ぐ）→ submissionFields 確定
タレントが応募フォームを開く
   └─ autofill=NAME/AGE/HEIGHT はプロフィールで初期値、COMPOSITE は非表示
アップロード（項目ごと）
   ├─ 成功 → fileUrl
   └─ 失敗・30秒止まった → 端末で受付番号 → POST /api/form-errors（届かなければ端末にためて後で送る）
                          → 「もう一度」or「あとで別途送る」
応募送信（30秒で画面に操作を戻す → 応募済みか確認）
   ├─ resolveApplicant() で本人確定（R4）
   ├─ 必須チェック・形チェック（失敗 → form_error_logs ＋項目ごとのエラーを返す）
   └─ application 作成（submissionAnswers・hasMissingAnswers 付き）。プロフィールは触らない
KAMITE再送
   └─ submissionFields を置き換え（管理者が直した autofill は引き継ぐ）。既存の submissionAnswers は触らない
管理者が回答を登録・修正
   └─ origin=ADMIN・updatedAt、hasMissingAnswers を再計算
```
