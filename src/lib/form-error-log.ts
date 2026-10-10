// フォームの失敗を form_error_logs に残す（管理者が受付番号で原因を追えるように）。
// 入力値・提出物の中身・パスワード・トークンは受け取る引数を作らない。
// 記録に失敗しても例外は投げない（記録のせいで応募そのものを止めない）。
import { after } from "next/server"
import { prisma } from "@/lib/db"
import { logger } from "@/lib/logger"
import { isErrorCode, makeErrorCode } from "@/lib/error-code"

export const FORM_ERROR_REASONS = [
  "REQUIRED_MISSING",
  "INVALID_VALUE",
  "TOO_LARGE",
  "BAD_TYPE",
  "NETWORK",
  "STALLED",
  "TIMEOUT",
  "UNAUTHORIZED",
  "FIELDS_CHANGED",
  "SERVER_ERROR",
  "OTHER",
] as const
export type FormErrorReason = (typeof FORM_ERROR_REASONS)[number]

export const FORM_NAMES = ["application", "upload", "register"] as const
export type FormName = (typeof FORM_NAMES)[number]

export function isFormErrorReason(value: unknown): value is FormErrorReason {
  return typeof value === "string" && (FORM_ERROR_REASONS as readonly string[]).includes(value)
}

export type FormErrorInput = {
  code?: string | null
  form: FormName
  talentId?: string | null
  jobId?: string | null
  field?: string | null
  reason: FormErrorReason
  source: "server" | "client"
  message?: string | null
  userAgent?: string | null
  occurredAt?: Date | null
}

const WEEK = 7 * 24 * 60 * 60 * 1000

// 端末の時計はずれていることがあるので、前後1週間を外れたら記録した時刻にする
function sanitizeOccurredAt(value: Date | null | undefined): Date {
  const now = Date.now()
  if (!value || Number.isNaN(value.getTime()) || Math.abs(value.getTime() - now) > WEEK) return new Date(now)
  return value
}

function isUniqueViolation(e: unknown): boolean {
  return (e as { code?: string } | null)?.code === "P2002"
}

export async function recordFormError(input: FormErrorInput): Promise<string> {
  const data = {
    form: input.form,
    talentId: input.talentId ?? null,
    jobId: input.jobId ?? null,
    field: input.field ? input.field.slice(0, 100) : null,
    reason: isFormErrorReason(input.reason) ? input.reason : "OTHER",
    source: input.source,
    message: input.message ? input.message.slice(0, 500) : null,
    userAgent: input.userAgent ? input.userAgent.slice(0, 300) : null,
    occurredAt: sanitizeOccurredAt(input.occurredAt),
  }

  let code = isErrorCode(input.code) ? input.code : makeErrorCode()
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await prisma.formErrorLog.create({ data: { ...data, code } })
      break
    } catch (e) {
      if (isUniqueViolation(e)) {
        code = makeErrorCode()
        continue
      }
      const message = e instanceof Error ? e.message : String(e)
      after(() => logger.error("form_error_log_save_failed", { message, code }))
      break
    }
  }

  after(() => logger.warn("form_error", { ...data, code }))
  return code
}
