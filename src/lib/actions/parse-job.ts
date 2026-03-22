"use server"

import { getGemini } from "@/lib/gemini"
import { parsedJobSchema } from "@/lib/validations/parsed-job"
import type { ParseResult, MatchedTalent, TalentCandidate } from "@/lib/validations/parsed-job"
import { getActiveTalentOptions } from "@/lib/queries"
import { prisma } from "@/lib/db"

const SYSTEM_PROMPT = `あなたはキャスティング案件のテキストを構造化するアシスタントです。
以下のJSON形式で出力してください。

{
  "title": "案件名",
  "clientCompanyName": "クライアント会社名",
  "clientContactName": "クライアント担当者名",
  "location": "撮影場所",
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

ステータスのマッピング:
- 決定、合格、採用、OK → ACCEPTED
- バラシ、不合格、落選、NG、見送り → REJECTED
- 選考中、検討中、保留、候補 → PENDING
- 明示的な記載がなければ PENDING

注意:
- テキストから読み取れない項目はnullにする
- タレント名はテキストに書かれたまま出力する
- 日付は可能な限りYYYY-MM-DD形式に変換する`

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
    const talents = await getActiveTalentOptions()
    const matchedTalents = matchTalents(job.talents, talents)

    const existingJobId = await findExistingJob(job.title)
    const existingClientId = job.clientCompanyName
      ? await findExistingClient(job.clientCompanyName)
      : null

    return {
      success: true,
      data: { job, matchedTalents, existingJobId, existingClientId },
    }
  } catch (e) {
    console.error("Gemini parse error:", e)
    return { success: false, error: "テキストの解析に失敗しました" }
  }
}

function matchTalents(
  entries: { name: string; status: string; date?: string | null; startTime?: string | null; location?: string | null; note?: string | null }[],
  talents: { id: string; name: string; nameKana: string }[]
): MatchedTalent[] {
  return entries.map((entry) => {
    const exact = talents.find(
      (t) => t.name === entry.name || t.nameKana === entry.name
    )
    if (exact) {
      return {
        ...entry,
        status: entry.status as "ACCEPTED" | "REJECTED" | "PENDING",
        matchedTalentId: exact.id,
        candidates: [exact],
      }
    }

    const partial: TalentCandidate[] = talents.filter(
      (t) =>
        t.name.includes(entry.name) ||
        entry.name.includes(t.name) ||
        t.nameKana.includes(entry.name) ||
        entry.name.includes(t.nameKana)
    )

    return {
      ...entry,
      status: entry.status as "ACCEPTED" | "REJECTED" | "PENDING",
      matchedTalentId: partial.length === 1 ? partial[0].id : null,
      candidates: partial,
    }
  })
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
