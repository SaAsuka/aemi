// アップロードの失敗を「何が原因か」に分けて、タレント向けの言葉にする（サーバー・ブラウザ共用）。
// 応答がJSONでない（Vercel の 413 は HTML で返る）場合も落ちないようにする。
export type UploadErrorKind = "TOO_LARGE" | "BAD_TYPE" | "NETWORK" | "STALLED" | "ABORTED" | "UNAUTHORIZED" | "OTHER"

export type UploadErrorInfo = {
  kind: UploadErrorKind
  // 失敗の記録（form_error_logs.reason）に入れる値。タレントが中止したものは記録しない（null）
  reason: "TOO_LARGE" | "BAD_TYPE" | "NETWORK" | "STALLED" | "UNAUTHORIZED" | "OTHER" | null
  message: string
}

const MESSAGES: Record<UploadErrorKind, string> = {
  TOO_LARGE: "ファイルが大きすぎます。もう少し小さいファイルを選んでください",
  BAD_TYPE: "この形式のファイルはアップロードできません",
  NETWORK: "通信の問題でアップロードできませんでした。電波の良い場所でもう一度お試しください",
  STALLED: "通信の問題でアップロードが止まりました。電波の良い場所でもう一度お試しください",
  ABORTED: "アップロードを中止しました",
  UNAUTHORIZED: "ログインが切れています。ログインし直してからもう一度お試しください",
  OTHER: "アップロードできませんでした。時間をおいてもう一度お試しください",
}

function readReason(body: unknown): string | null {
  if (body && typeof body === "object" && "reason" in body && typeof (body as { reason: unknown }).reason === "string") {
    return (body as { reason: string }).reason
  }
  return null
}

export function classifyUploadError(input: {
  status?: number | null
  body?: unknown
  error?: unknown
  stalled?: boolean
  aborted?: boolean
}): UploadErrorInfo {
  const kind = classifyKind(input)
  return { kind, reason: kind === "ABORTED" ? null : kind, message: MESSAGES[kind] }
}

function classifyKind({ status, body, stalled, aborted }: Parameters<typeof classifyUploadError>[0]): UploadErrorKind {
  if (aborted) return "ABORTED"
  if (stalled) return "STALLED"

  const reason = readReason(body)
  if (reason === "TOO_LARGE" || status === 413) return "TOO_LARGE"
  if (reason === "BAD_TYPE" || status === 415) return "BAD_TYPE"
  if (reason === "UNAUTHORIZED" || status === 401 || status === 403) return "UNAUTHORIZED"

  // 応答が来ていない＝通信の問題（XHR の onerror・fetch の TypeError・オフラインは status が無いか 0）
  if (status == null || status === 0) return "NETWORK"
  return "OTHER"
}
