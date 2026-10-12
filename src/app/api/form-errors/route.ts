import { NextResponse, after } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/db"
import { logger } from "@/lib/logger"
import { resolveRequester } from "@/lib/applicant"
import { FORM_ERROR_REASONS, recordFormError } from "@/lib/form-error-log"

/**
 * タレントの端末で起きた失敗（ストレージへのアップロードの失敗・止まった・通信切れ・送信が終わらない）を受け取って記録する。
 * これらはサーバーに届かないので、端末から報告してもらう。
 * 受付番号は端末が作って送ってくる（通信できないときもタレントに番号を見せるため）。
 */

export const dynamic = "force-dynamic"

const WINDOW_MS = 10 * 60 * 1000
const LIMIT = 30

const entrySchema = z.object({
  code: z.string().max(20).nullish(),
  form: z.enum(["application", "upload"]),
  jobId: z.string().max(50).nullish(),
  field: z.string().max(100).nullish(),
  reason: z.enum(FORM_ERROR_REASONS),
  message: z.string().max(2000).nullish(),
  occurredAt: z.string().max(40).nullish(),
})

const bodySchema = z.object({
  t: z.string().max(200).nullish(),
  errors: z.array(entrySchema).min(1).max(20),
})

export async function POST(request: Request) {
  let body: z.infer<typeof bodySchema>
  try {
    body = bodySchema.parse(await request.json())
  } catch {
    return NextResponse.json({ error: "リクエストの形が正しくありません" }, { status: 400 })
  }

  // talentId は本文から受け取らず、本人確認の結果を使う
  const requester = await resolveRequester({ t: body.t })
  if (!requester.ok) {
    after(() => logger.warn("form_error_report_unauthorized", { count: body.errors.length }))
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }
  const talentId = requester.isAdminProxy ? null : requester.talentId

  // 短時間に大量に送れないようにする（サーバーレスでメモリに頼れないので、記録の件数で数える）
  const recent = talentId
    ? await prisma.formErrorLog.count({ where: { talentId, createdAt: { gte: new Date(Date.now() - WINDOW_MS) } } })
    : 0
  if (recent >= LIMIT) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 })
  }

  const userAgent = request.headers.get("user-agent")
  const saved: { code: string; requested: string | null }[] = []
  for (const e of body.errors.slice(0, LIMIT - recent)) {
    const occurredAt = e.occurredAt ? new Date(e.occurredAt) : null
    const code = await recordFormError({
      code: e.code,
      form: e.form,
      talentId,
      jobId: e.jobId,
      field: e.field,
      reason: e.reason,
      source: "client",
      message: e.message,
      userAgent,
      occurredAt,
    })
    saved.push({ code, requested: e.code ?? null })
  }
  return NextResponse.json({ saved })
}
