# 外部システムから案件を受け取る口（KAMITE → VOZEL）

KAMITE（タレント事務所向けの案件供給サービス）に届いた案件を、VOZELの案件管理に
自動で登録するための受け口。**登録だけ**ができる口で、読み出し・削除はできない。

- 受け口：`POST /api/external/jobs`（このリポジトリ）
- 送る側：KAMITE の `src/lib/vozel.ts`（`develop/yokai-aomidori/app`）
- 送る単位：案件1件につき1回。新規も更新（追加募集・締切延長・金額変更）も同じ口

## 1. 鍵の決め方

aemi 側とKAMITE側に、同じ値を入れる。

| aemi（受ける側） | KAMITE（送る側） | 中身 |
|---|---|---|
| `KAMITE_API_KEY` | `VOZEL_API_KEY` | Authorization ヘッダに載せるキー |
| `KAMITE_API_SECRET` | `VOZEL_API_SECRET` | 本文の署名に使う秘密の文字列 |
| `KAMITE_ALLOWED_IPS`（任意） | — | 許可する送信元IP（カンマ区切り）。**空なら未使用** |
| — | `VOZEL_API_URL` | この口のURL |

生成の例：

    openssl rand -hex 32   # キー
    openssl rand -hex 32   # 署名用の秘密

> ⚠️ **送信元IPの固定は、いまは使えない。**
> KAMITEはVercelで動いており、外向きのIPが固定されない（固定IPはVercelのSecure Compute＝Enterprise機能）。
> そのため `KAMITE_ALLOWED_IPS` は**既定で空＝チェックなし**にしてある。
> 代わりに、キーだけでは通らないように**本文の署名**と**時刻の検証**を必須にしている
> （キーが漏れても、本文の差し替えと録って投げ直す攻撃は通らない）。
> 将来KAMITEを固定IPの取れる場所に移したら、この環境変数を入れるだけで有効になる。

## 2. リクエストの形

ヘッダ：

| ヘッダ | 中身 |
|---|---|
| `Authorization` | `Bearer <KAMITE_API_KEY>` |
| `Content-Type` | `application/json` |
| `X-Kamite-Source` | 送り元の名前。既定 `KAMITE` |
| `X-Kamite-Timestamp` | UNIX秒（**5分以上ずれていたら弾く**） |
| `X-Kamite-Signature` | `HMAC-SHA256(KAMITE_API_SECRET, "<timestamp>.<本文そのまま>")` の16進 |

本文（JSON）：

```json
{
  "externalId": "YK-2026-001",
  "sourceUrl": "https://app.kamite.jp/deals/xxxx",
  "title": "作品名または案件名",
  "description": "案件の説明",
  "location": "東京都調布市のスタジオ",
  "fee": 120000,
  "deadline": "2026-09-30T14:59:00.000Z",
  "status": "OPEN",
  "note": "種別・放送局・使用媒体などの補足",
  "roles": [
    {
      "label": "スタンドイン（メイン女性）",
      "gender": "FEMALE",
      "headcount": 1,
      "ageMin": 20, "ageMax": 29,
      "heightCm": 160, "heightTolerance": 3,
      "feeYen": 15000, "feeNote": "税別・交通費込み",
      "note": "演技経験歓迎"
    }
  ],
  "dates": [{ "type": "SHOOTING", "date": "2026-10-01", "note": "本番撮影日" }],
  "requirements": [{ "label": "全身写真", "kind": "PHOTO", "required": true, "note": null }]
}
```

- `status` は `DRAFT` / `OPEN` / `CLOSED` / `CANCELLED`
- `roles[].gender` は `MALE` / `FEMALE` / `OTHER`
- `dates[].type` は `AUDITION` / `SHOOTING` / `OTHER`
- `requirements[].kind` は `PHOTO` / `FILE` / `TEXT` / `URL`
- **仕入れ原価は送られてこない。** `fee` は事務所へ提示している額

## 3. 受け取ったあとの入り方

- 取引先（`clients`）は `X-Kamite-Source` の名前で1社作り、その下に案件をぶら下げる
- `jobs.externalSource` + `jobs.externalId` で**同じ案件かを判定して上書き**する（二度送られても増えない）
- **枠（roles）と提出物（requirements）は `jobs.note` に文章で入る。** VOZEL側に入れ物が無いため
- 枠が**1つだけ**のときは、その条件（性別・年齢・身長）を案件そのものの条件にも入れる。
  複数あるときは案件側は空にして、中身は note に全部残す
- **人が締め切った（CLOSED）・取り下げた（CANCELLED）案件は、送られてきても募集中に戻さない**

## 4. 返るもの

| 状態 | 返り |
|---|---|
| 200 | `{ "ok": true, "jobId": "...", "created": true/false }` |
| 400 | HTTPSでない／本文が不正 |
| 401 | キー違い・署名なし・署名不一致・時刻が古い |
| 403 | 許可していない送信元IP（`KAMITE_ALLOWED_IPS` を入れているときだけ） |
| 429 | 1分に20件を超えた |
| 500 | 登録に失敗 |

**弾いたものも含めて全部 `external_job_logs` に残る**（いつ・どのIPから・何をして・どうなったか）。
不審なアクセスに気づくためなので、このテーブルを消さない。

## 5. 動作確認

KAMITE側から1件だけ送れる。まず `--dry` で中身を見てから送る。

    # KAMITEのリポジトリで
    npx tsx scripts/forward-deal.ts YK-2026-001 --dry   # 送らずに中身だけ表示
    npx tsx scripts/forward-deal.ts YK-2026-001         # 実際に送る

自動で流すかどうかは、KAMITEの管理画面「案件管理 → 取込メール」の**VOZEL連携のスイッチ**で切り替える
（事故ったときに再デプロイを待たず止められるようDBに持たせてある）。
