import { NextResponse, after } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/db"
import { logger } from "@/lib/logger"
import { resolveRequester } from "@/lib/applicant"
import { createUploadUrl } from "@/lib/supabase-storage"
import { recordFormError } from "@/lib/form-error-log"
import { parseSubmissionFields, submissionStoragePrefix } from "@/lib/submission-fields"

/**
 * 応募の自由項目のファイルを、ブラウザからストレージへ直接上げるための署名付きURLを発行する。
 * 「この人がこの案件のこの項目に上げてよいか」をここで確かめる。ファイル自体はサーバーを通らない。
 */

export const dynamic = "force-dynamic"

const MAX_SIZE = 100 * 1024 * 1024

// 種類 → 保存するときの拡張子。ファイル名は利用者の入力から作らない
const IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
  "image/gif": "gif",
}
const FILE_TYPES: Record<string, string> = {
  ...IMAGE_TYPES,
  "application/pdf": "pdf",
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/webm": "webm",
  "audio/mpeg": "mp3",
  "audio/wav": "wav",
}
// iOS の HEIC などで種類が空のとき、ファイル名の拡張子から補う
const EXT_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  heic: "image/heic",
  heif: "image/heif",
  gif: "image/gif",
  pdf: "application/pdf",
  mp4: "video/mp4",
  mov: "video/quicktime",
  webm: "video/webm",
  mp3: "audio/mpeg",
  wav: "audio/wav",
}

const bodySchema = z.object({
  jobId: z.string().min(1).max(50),
  fieldKey: z.string().min(1).max(40),
  fileName: z.string().min(1).max(255),
  contentType: z.string().max(100).nullish(),
  size: z.number().int().min(1),
  t: z.string().max(200).nullish(),
  talentId: z.string().max(50).nullish(),
})

export async function POST(request: Request) {
  let body: z.infer<typeof bodySchema>
  try {
    body = bodySchema.parse(await request.json())
  } catch {
    return NextResponse.json({ error: "リクエストの形が正しくありません", reason: "INVALID" }, { status: 400 })
  }

  const requester = await resolveRequester({ t: body.t, talentId: body.talentId })
  if (!requester.ok) {
    // 本人確認できない呼び出しは記録テーブルに残さない（外から記録を埋められないように）
    after(() => logger.warn("upload_url_unauthorized", { jobId: body.jobId }))
    return NextResponse.json({ error: "ログインし直してください", reason: "UNAUTHORIZED" }, { status: 401 })
  }
  const talentId = requester.talentId
  const userAgent = request.headers.get("user-agent")

  const reject = async (reason: "BAD_TYPE" | "TOO_LARGE" | "UNKNOWN_FIELD", error: string) => {
    const code = await recordFormError({
      form: "upload",
      source: "server",
      talentId,
      jobId: body.jobId,
      field: body.fieldKey,
      reason: reason === "UNKNOWN_FIELD" ? "INVALID_VALUE" : reason,
      message: error,
      userAgent,
    })
    return NextResponse.json({ error, reason, code }, { status: 400 })
  }

  try {
    const job = await prisma.job.findUnique({ where: { id: body.jobId }, select: { submissionFields: true } })
    const field = parseSubmissionFields(job?.submissionFields).find((f) => f.key === body.fieldKey)
    if (!field || (field.kind !== "PHOTO" && field.kind !== "FILE") || field.autofill === "COMPOSITE") {
      return reject("UNKNOWN_FIELD", "この項目にはファイルをアップロードできません")
    }

    const ext = body.fileName.split(".").pop()?.toLowerCase() ?? ""
    const contentType = body.contentType || EXT_TYPES[ext] || ""
    const allowed = field.kind === "PHOTO" ? IMAGE_TYPES : FILE_TYPES
    const saveExt = allowed[contentType]
    if (!saveExt) {
      return reject("BAD_TYPE", field.kind === "PHOTO" ? "写真（画像）を選んでください" : "この形式のファイルはアップロードできません")
    }
    if (body.size > MAX_SIZE) {
      return reject("TOO_LARGE", "ファイルサイズが100MBを超えています")
    }

    const path = `${submissionStoragePrefix(talentId, body.jobId)}${field.key}-${Date.now()}.${saveExt}`
    const { uploadUrl, fileUrl } = await createUploadUrl(path)
    return NextResponse.json({ uploadUrl, fileUrl, contentType })
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    const code = await recordFormError({
      form: "upload",
      source: "server",
      talentId,
      jobId: body.jobId,
      field: body.fieldKey,
      reason: "SERVER_ERROR",
      message,
      userAgent,
    })
    return NextResponse.json({ error: "アップロードの準備に失敗しました", reason: "SERVER_ERROR", code }, { status: 500 })
  }
}
