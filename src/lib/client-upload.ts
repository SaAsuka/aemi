// ブラウザ用。応募の自由項目のファイルを、ストレージへ直接アップロードする。
// サーバー（Vercel Functions）を通さないので、本文4.5MBの上限に当たらない。
// 止まったまま「くるくる」が終わらない状態を作らないよう、時間で区切る。
import { classifyUploadError, type UploadErrorInfo } from "@/lib/upload-errors"

const URL_TIMEOUT_MS = 15_000
const STALL_MS = 30_000
const MAX_LONG_SIDE = 2400

export class UploadError extends Error {
  constructor(public info: UploadErrorInfo, public code: string | null = null) {
    super(info.message)
  }
}

export type UploadResult = { fileUrl: string; fileName: string }

export async function uploadSubmissionFile(input: {
  jobId: string
  fieldKey: string
  kind: "PHOTO" | "FILE"
  file: File
  t?: string | null
  // 管理者が応募詳細で代わりにアップロードするときだけ渡す
  talentId?: string | null
  onProgress?: (percent: number) => void
  signal?: AbortSignal
}): Promise<UploadResult> {
  const { jobId, fieldKey, kind, t, talentId, onProgress, signal } = input
  if (signal?.aborted) throw new UploadError(classifyUploadError({ aborted: true }))

  const file = kind === "PHOTO" ? await shrinkPhoto(input.file) : input.file

  const target = await requestUploadUrl({
    jobId,
    fieldKey,
    fileName: file.name,
    contentType: file.type || null,
    size: file.size,
    t: t ?? null,
    talentId: talentId ?? null,
  }, signal)

  await putWithProgress(target.uploadUrl, file, target.contentType, onProgress, signal)
  return { fileUrl: target.fileUrl, fileName: input.file.name }
}

async function requestUploadUrl(
  body: Record<string, unknown>,
  signal?: AbortSignal
): Promise<{ uploadUrl: string; fileUrl: string; contentType: string }> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), URL_TIMEOUT_MS)
  const onAbort = () => controller.abort()
  signal?.addEventListener("abort", onAbort)
  try {
    const res = await fetch("/api/submissions/upload-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
    const json = await res.json().catch(() => null)
    if (!res.ok) throw new UploadError(classifyUploadError({ status: res.status, body: json }), json?.code ?? null)
    return json
  } catch (e) {
    if (e instanceof UploadError) throw e
    if (signal?.aborted) throw new UploadError(classifyUploadError({ aborted: true }))
    // 15秒で返事が無い・通信できない
    throw new UploadError(classifyUploadError({ status: 0, error: e, stalled: controller.signal.aborted }))
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener("abort", onAbort)
  }
}

function putWithProgress(
  url: string,
  file: Blob,
  contentType: string,
  onProgress?: (percent: number) => void,
  signal?: AbortSignal
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    let stalled = false
    let stallTimer: ReturnType<typeof setTimeout> | undefined

    const resetStallTimer = () => {
      clearTimeout(stallTimer)
      stallTimer = setTimeout(() => {
        stalled = true
        xhr.abort()
      }, STALL_MS)
    }
    const cleanup = () => {
      clearTimeout(stallTimer)
      signal?.removeEventListener("abort", onAbort)
    }
    const onAbort = () => xhr.abort()

    xhr.open("PUT", url)
    xhr.setRequestHeader("Content-Type", contentType || file.type || "application/octet-stream")
    xhr.setRequestHeader("x-upsert", "false")
    // 公開して問題ない鍵。署名付きURLが鍵なしで通らない場合に備え、設定されていれば付ける
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (anonKey) {
      xhr.setRequestHeader("apikey", anonKey)
      xhr.setRequestHeader("Authorization", `Bearer ${anonKey}`)
    }

    xhr.upload.onprogress = (e) => {
      resetStallTimer()
      if (e.lengthComputable) onProgress?.(Math.round((e.loaded / e.total) * 100))
    }
    xhr.onload = () => {
      cleanup()
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100)
        resolve()
      } else {
        let body: unknown = xhr.responseText
        try {
          body = JSON.parse(xhr.responseText)
        } catch {
          // 本文がJSONでなくてもよい
        }
        reject(new UploadError(classifyUploadError({ status: xhr.status, body })))
      }
    }
    xhr.onerror = () => {
      cleanup()
      reject(new UploadError(classifyUploadError({ status: 0, error: "network" })))
    }
    xhr.onabort = () => {
      cleanup()
      reject(new UploadError(classifyUploadError(stalled ? { stalled: true } : { aborted: true })))
    }

    signal?.addEventListener("abort", onAbort)
    resetStallTimer()
    xhr.send(file)
  })
}

// 写真を長辺2400pxのJPEGに縮める。ブラウザが読めない形式（ChromeのHEICなど）はそのまま返す
async function shrinkPhoto(file: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" })
    const scale = Math.min(1, MAX_LONG_SIDE / Math.max(bitmap.width, bitmap.height))
    const width = Math.round(bitmap.width * scale)
    const height = Math.round(bitmap.height * scale)
    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext("2d")
    if (!ctx) return file
    ctx.drawImage(bitmap, 0, 0, width, height)
    bitmap.close()
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.85))
    if (!blob) return file
    // 縮めても小さくならない JPEG は元のまま
    if (file.type === "image/jpeg" && scale === 1 && blob.size >= file.size) return file
    const base = file.name.replace(/\.[^.]+$/, "") || "photo"
    return new File([blob], `${base}.jpg`, { type: "image/jpeg" })
  } catch {
    return file
  }
}
