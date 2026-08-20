"use server"

import { getGemini } from "@/lib/gemini"
import { parsedJobResponseSchema, parsedJobSchema } from "@/lib/validations/parsed-job"
import type { ParseResult } from "@/lib/validations/parsed-job"
import { prisma } from "@/lib/db"

const SYSTEM_PROMPT = `あなたはキャスティング案件のテキストを構造化するアシスタントです。
1つのテキストに複数の役柄（性別・年齢・体型が異なる募集）が含まれる場合があります。
役柄ごとに分割して、以下のJSON形式で出力してください。

{
  "common": {
    "clientCompanyName": "クライアント会社名",
    "clientContactName": "クライアント担当者名",
    "location": "撮影場所",
    "deadline": "YYYY-MM-DDTHH:MM:SS形式（応募締切）",
    "dates": [
      {
        "type": "AUDITION or SHOOTING or OTHER",
        "date": "YYYY-MM-DD形式",
        "startTime": "HH:MM形式（わかる場合）",
        "endTime": "HH:MM形式（わかる場合）",
        "location": "個別の場所（全体と異なる場合）",
        "note": "備考"
      }
    ],
    "requirements": ["ACTING_VIDEO", "VOICE_SAMPLE", "PAST_WORK_VIDEO", "PROFILE_PHOTO"],
    "description": "案件の説明・詳細",
    "note": "その他備考（案件全体に関わるもの）"
  },
  "roles": [
    {
      "title": "案件名 - 役柄名",
      "genderReq": "MALE or FEMALE or OTHER or null",
      "ageMin": 20,
      "ageMax": 30,
      "heightMin": 160,
      "heightMax": 180,
      "fee": 10000,
      "capacity": 3,
      "note": "この役柄固有の備考",
      "talents": [
        {
          "name": "タレント名",
          "status": "ACCEPTED or REJECTED or PENDING",
          "date": "YYYY-MM-DD形式（わかる場合）",
          "startTime": "HH:MM形式（わかる場合）",
          "location": "個別の場所（全体と異なる場合）",
          "note": "個別の備考"
        }
      ]
    }
  ]
}

ルール:
- 役柄が1つしかない場合でも、roles配列の長さは1にする
- roles[i].titleは「案件名 - 役柄名」形式にする（例: "〇〇CM撮影 - 男性メイン"）
- 役柄が1つだけの場合はtitleを案件名そのものにしてよい
- 複数役柄がある場合は性別・年齢・体型条件の違いで分割する
- 共通情報（場所、日程、締切、クライアント、提出要件）はcommonに入れる
- 役柄固有の情報（性別、年齢、身長、報酬、募集人数）はrolesに入れる
- タレント候補がいる場合は該当する役柄のtalentsに入れる

フィールドの説明:
- fee: 報酬金額（数値、円単位）。「1万円」→10000、「5,000円」→5000
- genderReq: 性別条件。「男性」→MALE、「女性」→FEMALE、「不問」→null
- ageMin/ageMax: 年齢条件（数値）。「20代」→ageMin:20, ageMax:29
- heightMin/heightMax: 身長条件（cm、数値）
- capacity: 募集人数（数値）
- dates: 日程の配列。typeはAUDITION（オーディション）、SHOOTING（撮影）、OTHER（その他）
- requirements: タレントに提出を求めるもの。以下のカテゴリのみ使用:
  - ACTING_VIDEO: 課題演技動画、自己PR動画、演技動画
  - VOICE_SAMPLE: ボイスサンプル、音声
  - PAST_WORK_VIDEO: 過去出演動画、出演映像
  - PROFILE_PHOTO: 宣材写真、プロフィール写真、全身写真
  PROFILE_PHOTOは必ず配列に含める。その他はテキストに「動画提出」「写真提出」「ボイスサンプル」等の記載があれば該当カテゴリを配列に含める

ステータスのマッピング:
- 決定、合格、採用、OK → ACCEPTED
- バラシ、不合格、落選、NG、見送り → REJECTED
- 選考中、検討中、保留、候補 → PENDING
- 明示的な記載がなければ PENDING

注意:
- テキストから読み取れない項目はnullにする
- タレント名はテキストに書かれたまま出力する
- 日付は可能な限りYYYY-MM-DD形式に変換する。年が省略されている場合（例: "4/13"）は現在の年（${new Date().getFullYear()}年）を使用する
- 締切(deadline)の時間: 締切時間が明示されている場合（例: "12時まで"、"15:00締切"、"正午"）はその時間を設定する。時間が明示されていない場合はT23:59:00とする
- 金額は数値に変換する（文字列ではなく数値型で出力）

具体例:
入力テキスト「〇〇化粧品CM 男性20代170cm以上 3名 / 女性30代 2名 報酬各5万円 渋谷スタジオ 4/10撮影 締切4/5 自己PR動画提出」
出力:
{
  "common": {
    "clientCompanyName": null,
    "clientContactName": null,
    "location": "渋谷スタジオ",
    "deadline": "2026-04-05T23:59:00",
    "dates": [
      { "type": "SHOOTING", "date": "2026-04-10", "startTime": null, "endTime": null, "location": null, "note": null }
    ],
    "requirements": ["ACTING_VIDEO"],
    "description": "〇〇化粧品CM",
    "note": null
  },
  "roles": [
    {
      "title": "〇〇化粧品CM - 男性20代",
      "genderReq": "MALE",
      "ageMin": 20,
      "ageMax": 29,
      "heightMin": 170,
      "heightMax": null,
      "fee": 50000,
      "capacity": 3,
      "note": null,
      "talents": []
    },
    {
      "title": "〇〇化粧品CM - 女性30代",
      "genderReq": "FEMALE",
      "ageMin": 30,
      "ageMax": 39,
      "heightMin": null,
      "heightMax": null,
      "fee": 50000,
      "capacity": 2,
      "note": null,
      "talents": []
    }
  ]
}`

const FALLBACK_MODELS = ["gemini-2.5-flash", "gemini-3.6-flash"] as const

function isQuotaError(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e)
  return msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED") || msg.includes("quota")
}

export async function parseJobText(text: string): Promise<
  { success: true; data: ParseResult } | { success: false; error: string }
> {
  if (!text.trim()) {
    return { success: false, error: "テキストを入力してください" }
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let response: any
    for (let i = 0; i < FALLBACK_MODELS.length; i++) {
      const model = FALLBACK_MODELS[i]
      try {
        response = await getGemini().models.generateContent({
          model,
          config: {
            systemInstruction: SYSTEM_PROMPT,
            responseMimeType: "application/json",
          },
          contents: [{ role: "user", parts: [{ text }] }],
        })
        break
      } catch (e) {
        if (isQuotaError(e) && i < FALLBACK_MODELS.length - 1) {
          console.warn(`[Gemini] ${model} quota exceeded, falling back to ${FALLBACK_MODELS[i + 1]}`)
          continue
        }
        throw e
      }
    }
    if (!response) throw new Error("全モデルでクォータ超過しました")

    let rawText: string | undefined
    try {
      rawText = response.text
    } catch (e) {
      console.error("Gemini response.text threw:", e, "response:", JSON.stringify(response))
      return { success: false, error: "AIからの応答が空でした。しばらく待ってから再試行してください。" }
    }
    if (!rawText) {
      console.error("Gemini returned empty response. response:", JSON.stringify(response))
      return { success: false, error: "AIからの応答が空でした。しばらく待ってから再試行してください。" }
    }

    // マークダウンのコードブロックが含まれていれば除去
    const cleaned = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim()

    let raw: unknown
    try {
      raw = JSON.parse(cleaned)
    } catch (e) {
      console.error("JSON.parse失敗:", e)
      console.error("Gemini生レスポンス:", cleaned.slice(0, 500))
      const msg = e instanceof Error ? e.message : String(e)
      return { success: false, error: `JSONの解析に失敗しました: ${msg}` }
    }

    const parsed = parsedJobResponseSchema.safeParse(raw)

    let common: ReturnType<typeof parsedJobResponseSchema.parse>["common"]
    let roles: ReturnType<typeof parsedJobResponseSchema.parse>["roles"]

    if (parsed.success) {
      common = parsed.data.common
      roles = parsed.data.roles
    } else {
      const issues = parsed.error.issues.map(i => `${i.path.join(".")}: ${i.message}`).join(" / ")
      console.error("スキーマバリデーション失敗:", issues)
      console.error("Gemini生レスポンス:", JSON.stringify(raw, null, 2))
      return { success: false, error: `解析結果の形式が不正です。[詳細: ${issues}]` }
    }

    const jobs = await Promise.all(
      roles.map(async (role) => ({
        role,
        existingJobId: await findExistingJob(role.title),
      }))
    )

    return {
      success: true,
      data: { common, jobs, existingClientId: null },
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error("Gemini parse error:", msg)
    return { success: false, error: `テキストの解析に失敗しました: ${msg}` }
  }
}

async function findExistingJob(title: string): Promise<string | null> {
  if (!title) return null
  const job = await prisma.job.findFirst({
    where: { title: { contains: title, mode: "insensitive" } },
    select: { id: true },
    orderBy: { createdAt: "desc" },
  })
  return job?.id ?? null
}
