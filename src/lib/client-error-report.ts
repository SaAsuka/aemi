// ブラウザ用。端末で起きた失敗を /api/form-errors へ報告する。
// 受付番号はその場で作って返す（通信できなくてもタレントに番号を見せられるように）。
// 届かなかった報告は localStorage にためて、次の操作のとき・応募の送信前に送り直す。
import { makeErrorCode } from "@/lib/error-code"

const QUEUE_KEY = "form-error-queue"
const MAX_QUEUE = 50
const BATCH = 20

type Reason = "TOO_LARGE" | "BAD_TYPE" | "NETWORK" | "STALLED" | "TIMEOUT" | "UNAUTHORIZED" | "SERVER_ERROR" | "OTHER"

export type ClientErrorReport = {
  code: string
  form: "application" | "upload"
  jobId: string | null
  field: string | null
  reason: Reason
  message: string | null
  occurredAt: string
}

// 送り直すか：通信できなかった・サーバー側の失敗（5xx）だけ送り直す。
// 回数制限（429）・ログイン切れ（401）・形の不備（400）は送り直しても通らないので捨てる
export function shouldRetryReport(result: { status?: number | null }): boolean {
  if (result.status == null || result.status === 0) return true
  return result.status >= 500
}

function readQueue(): ClientErrorReport[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY)
    const list = raw ? JSON.parse(raw) : []
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

function writeQueue(list: ClientErrorReport[]) {
  try {
    if (list.length === 0) localStorage.removeItem(QUEUE_KEY)
    else localStorage.setItem(QUEUE_KEY, JSON.stringify(list.slice(-MAX_QUEUE)))
  } catch {
    // 保存できない端末（プライベートブラウズ等）では送り直しをあきらめる
  }
}

async function send(reports: ClientErrorReport[], t: string | null | undefined): Promise<{ status: number | null }> {
  try {
    const res = await fetch("/api/form-errors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ t: t ?? null, errors: reports }),
      keepalive: true,
    })
    return { status: res.status }
  } catch {
    return { status: null }
  }
}

export function reportClientError(input: {
  form: "application" | "upload"
  jobId?: string | null
  field?: string | null
  reason: Reason
  message?: string | null
  t?: string | null
}): string {
  const report: ClientErrorReport = {
    code: makeErrorCode(),
    form: input.form,
    jobId: input.jobId ?? null,
    field: input.field ?? null,
    reason: input.reason,
    message: input.message ? input.message.slice(0, 500) : null,
    occurredAt: new Date().toISOString(),
  }
  void send([report], input.t).then((r) => {
    if (r.status !== null && r.status >= 200 && r.status < 300) return
    if (shouldRetryReport(r)) writeQueue([...readQueue(), report])
  })
  return report.code
}

// ためていた報告を送り直す。応募の送信前にも呼ぶ（「あとで別途送る」の確認に、端末側の記録を間に合わせるため）
export async function flushErrorQueue(t?: string | null): Promise<void> {
  let queue = readQueue()
  while (queue.length > 0) {
    const batch = queue.slice(0, BATCH)
    const r = await send(batch, t)
    const ok = r.status !== null && r.status >= 200 && r.status < 300
    if (!ok && shouldRetryReport(r)) {
      writeQueue(queue)
      return
    }
    // 送れた分も、送り直しても通らない分も、キューから外す
    queue = queue.slice(batch.length)
    writeQueue(queue)
  }
}
