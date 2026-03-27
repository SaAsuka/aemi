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
    "startsAt": "YYYY-MM-DDTHH:MM:SS形式（開始日時）",
    "endsAt": "YYYY-MM-DDTHH:MM:SS形式（終了日時）",
    "deadline": "YYYY-MM-DDTHH:MM:SS形式（応募締切）",
    "dates": "日程情報（テキストのまま）",
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
- 共通情報（場所、日程、締切、クライアント）はcommonに入れる
- 役柄固有の情報（性別、年齢、身長、報酬、募集人数）はrolesに入れる
- タレント候補がいる場合は該当する役柄のtalentsに入れる

フィールドの説明:
- fee: 報酬金額（数値、円単位）。「1万円」→10000、「5,000円」→5000
- genderReq: 性別条件。「男性」→MALE、「女性」→FEMALE、「不問」→null
- ageMin/ageMax: 年齢条件（数値）。「20代」→ageMin:20, ageMax:29
- heightMin/heightMax: 身長条件（cm、数値）
- capacity: 募集人数（数値）

ステータスのマッピング:
- 決定、合格、採用、OK → ACCEPTED
- バラシ、不合格、落選、NG、見送り → REJECTED
- 選考中、検討中、保留、候補 → PENDING
- 明示的な記載がなければ PENDING

注意:
- テキストから読み取れない項目はnullにする
- タレント名はテキストに書かれたまま出力する
- 日付は可能な限りYYYY-MM-DD形式に変換する
- 金額は数値に変換する（文字列ではなく数値型で出力）

具体例:
入力テキスト「〇〇化粧品CM 男性20代170cm以上 3名 / 女性30代 2名 報酬各5万円 渋谷スタジオ 4/10撮影 締切4/5」
出力:
{
  "common": {
    "clientCompanyName": null,
    "clientContactName": null,
    "location": "渋谷スタジオ",
    "startsAt": "2026-04-10T00:00:00",
    "endsAt": null,
    "deadline": "2026-04-05T00:00:00",
    "dates": "4/10撮影",
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

export async function parseJobText(text: string): Promise<
  { success: true; data: ParseResult } | { success: false; error: string }
> {
  if (!text.trim()) {
    return { success: false, error: "テキストを入力してください" }
  }

  try {
    const response = await getGemini().models.generateContent({
      model: "gemini-2.5-flash",
      contents: `${SYSTEM_PROMPT}\n\n---\n\n${text}`,
      config: {
        responseMimeType: "application/json",
      },
    })

    const raw = JSON.parse(response.text ?? "{}")

    const parsed = parsedJobResponseSchema.safeParse(raw)

    let common: ReturnType<typeof parsedJobResponseSchema.parse>["common"]
    let roles: ReturnType<typeof parsedJobResponseSchema.parse>["roles"]

    if (parsed.success) {
      common = parsed.data.common
      roles = parsed.data.roles
    } else {
      console.error("新フォーマットパース失敗:", JSON.stringify(parsed.error.issues, null, 2))
      console.error("Gemini生レスポンス:", JSON.stringify(raw, null, 2))

      const legacy = parsedJobSchema.safeParse(raw)
      if (legacy.success) {
        console.log("旧フォーマットでパース成功、変換します")
        const d = legacy.data
        common = {
          clientCompanyName: d.clientCompanyName,
          clientContactName: d.clientContactName,
          location: d.location,
          startsAt: d.startsAt,
          endsAt: d.endsAt,
          deadline: d.deadline,
          dates: d.dates,
          description: d.description,
          note: d.note,
        }
        roles = [{
          title: d.title,
          genderReq: d.genderReq,
          ageMin: d.ageMin,
          ageMax: d.ageMax,
          heightMin: d.heightMin,
          heightMax: d.heightMax,
          fee: d.fee,
          capacity: d.capacity,
          note: d.note,
          talents: d.talents,
        }]
      } else {
        console.error("旧フォーマットもパース失敗:", JSON.stringify(legacy.error.issues, null, 2))
        return { success: false, error: "パース結果の形式が不正です" }
      }
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
    console.error("Gemini parse error:", e)
    return { success: false, error: "テキストの解析に失敗しました" }
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
