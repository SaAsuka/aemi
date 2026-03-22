"use server"

import { getGemini } from "@/lib/gemini"
import { parsedJobSchema } from "@/lib/validations/parsed-job"
import type { ParseResult } from "@/lib/validations/parsed-job"
import { prisma } from "@/lib/db"

const SYSTEM_PROMPT = `あなたはキャスティング案件のテキストを構造化するアシスタントです。
以下のJSON形式で出力してください。

{
  "title": "案件名",
  "clientCompanyName": "クライアント会社名",
  "clientContactName": "クライアント担当者名",
  "description": "案件の説明・詳細",
  "location": "撮影場所",
  "fee": 10000,
  "genderReq": "MALE or FEMALE or OTHER or null",
  "ageMin": 20,
  "ageMax": 30,
  "heightMin": 160,
  "heightMax": 180,
  "startsAt": "YYYY-MM-DDTHH:MM:SS形式（開始日時）",
  "endsAt": "YYYY-MM-DDTHH:MM:SS形式（終了日時）",
  "deadline": "YYYY-MM-DDTHH:MM:SS形式（応募締切）",
  "capacity": 3,
  "dates": "日程情報（テキストのまま）",
  "note": "その他備考",
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

フィールドの説明:
- fee: 報酬金額（数値、円単位）。「1万円」→10000、「5,000円」→5000
- genderReq: 性別条件。「男性」→MALE、「女性」→FEMALE、「不問」→null
- ageMin/ageMax: 年齢条件（数値）。「20代」→ageMin:20, ageMax:29
- heightMin/heightMax: 身長条件（cm、数値）
- startsAt/endsAt: 案件の開始・終了日時
- deadline: 応募締切日時
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
- 金額は数値に変換する（文字列ではなく数値型で出力）`

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
    const parsed = parsedJobSchema.safeParse(raw)
    if (!parsed.success) {
      return { success: false, error: "パース結果の形式が不正です" }
    }

    const job = parsed.data

    const existingJobId = await findExistingJob(job.title)
    const existingClientId = job.clientCompanyName
      ? await findExistingClient(job.clientCompanyName)
      : null

    return {
      success: true,
      data: { job, existingJobId, existingClientId },
    }
  } catch (e) {
    console.error("Gemini parse error:", e)
    return { success: false, error: "テキストの解析に失敗しました" }
  }
}

async function findExistingJob(title: string): Promise<string | null> {
  const job = await prisma.job.findFirst({
    where: { title: { contains: title, mode: "insensitive" } },
    select: { id: true },
    orderBy: { createdAt: "desc" },
  })
  return job?.id ?? null
}

async function findExistingClient(companyName: string): Promise<string | null> {
  const client = await prisma.client.findFirst({
    where: { companyName: { contains: companyName, mode: "insensitive" } },
    select: { id: true },
  })
  return client?.id ?? null
}
