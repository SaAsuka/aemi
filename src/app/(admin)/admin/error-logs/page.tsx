import Link from "next/link"
import { AlertTriangle } from "lucide-react"
import { getFormErrorLogs } from "@/lib/actions/form-error-logs"
import { BTN_PRIMARY, BTN_SECONDARY, FIELD, PANEL } from "@/components/admin/styles"

const REASON_LABELS: Record<string, string> = {
  REQUIRED_MISSING: "必須が未入力",
  INVALID_VALUE: "入力の形が違う",
  TOO_LARGE: "ファイルが大きすぎる",
  BAD_TYPE: "ファイルの形式が違う",
  NETWORK: "通信の問題",
  STALLED: "アップロードが止まった",
  TIMEOUT: "送信が終わらなかった",
  UNAUTHORIZED: "ログイン切れ",
  FIELDS_CHANGED: "入力中に案件の項目が変わった",
  SERVER_ERROR: "サーバー側の失敗",
  OTHER: "その他",
}
const FORM_LABELS: Record<string, string> = { application: "応募", upload: "アップロード", register: "登録" }

function deviceOf(ua: string | null): string {
  if (!ua) return ""
  const app = /Line\//i.test(ua) ? "LINE内" : /CriOS|Chrome/i.test(ua) ? "Chrome" : /Safari/i.test(ua) ? "Safari" : "その他"
  const os = /iPhone|iPad/i.test(ua) ? "iPhone" : /Android/i.test(ua) ? "Android" : /Windows/i.test(ua) ? "Windows" : /Mac/i.test(ua) ? "Mac" : ""
  return [os, app].filter(Boolean).join("・")
}

function formatDateTime(d: Date) {
  const jst = new Date(d.getTime() + 9 * 60 * 60 * 1000)
  const p = (n: number) => String(n).padStart(2, "0")
  return `${jst.getUTCFullYear()}/${jst.getUTCMonth() + 1}/${jst.getUTCDate()} ${p(jst.getUTCHours())}:${p(jst.getUTCMinutes())}`
}

type SearchParams = { code?: string; form?: string; talentId?: string; jobId?: string }

export default async function ErrorLogsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams
  const logs = await getFormErrorLogs(params)
  const narrowed = Boolean(params.code || params.form || params.talentId || params.jobId)

  const hrefWith = (patch: Partial<SearchParams>) => {
    const next = new URLSearchParams()
    for (const [k, v] of Object.entries({ ...params, ...patch })) if (v) next.set(k, v)
    const qs = next.toString()
    return qs ? `/admin/error-logs?${qs}` : "/admin/error-logs"
  }

  return (
    <div className="space-y-6 pb-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-neutral-950 sm:text-2xl">エラー記録</h1>
        <p className="mt-1 text-sm text-neutral-500">
          応募・アップロードで起きた失敗の記録です（直近200件）。タレントから受付番号を聞いたら、ここで検索してください。
        </p>
      </div>

      <form method="get" className={`${PANEL} grid grid-cols-1 gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_180px_auto] sm:items-end sm:p-5`}>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-neutral-900">受付番号</span>
          <input name="code" defaultValue={params.code ?? ""} placeholder="例: E-7K2X9Q" autoComplete="off" className={FIELD} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-neutral-900">どこで</span>
          <select name="form" defaultValue={params.form ?? ""} className={FIELD}>
            <option value="">すべて</option>
            <option value="application">応募</option>
            <option value="upload">アップロード</option>
          </select>
        </label>
        {params.talentId && <input type="hidden" name="talentId" value={params.talentId} />}
        {params.jobId && <input type="hidden" name="jobId" value={params.jobId} />}
        <div className="flex gap-2">
          <button type="submit" className={BTN_PRIMARY}>
            探す
          </button>
          {narrowed && (
            <Link href="/admin/error-logs" className={BTN_SECONDARY}>
              条件をクリア
            </Link>
          )}
        </div>
      </form>

      <section aria-label="エラー記録の一覧" className={`${PANEL} overflow-clip`}>
        {logs.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <AlertTriangle className="mx-auto size-8 text-neutral-300" aria-hidden="true" />
            <p className="mt-4 text-sm font-medium text-neutral-950">{narrowed ? "条件に合う記録はありません" : "まだ記録はありません"}</p>
          </div>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {logs.map((l) => (
              <li key={l.id} className="grid gap-1.5 px-4 py-3.5 text-sm sm:grid-cols-[150px_minmax(0,1fr)] sm:px-5">
                <div className="text-xs text-neutral-500">
                  <p className="font-mono text-sm font-medium text-neutral-950">{l.code}</p>
                  <p>{formatDateTime(l.occurredAt)}</p>
                </div>
                <div className="min-w-0 space-y-1">
                  <p className="text-neutral-950">
                    <span className="font-medium">{REASON_LABELS[l.reason] ?? l.reason}</span>
                    <span className="ml-2 text-xs text-neutral-500">
                      {FORM_LABELS[l.form] ?? l.form}・{l.source === "client" ? "端末から報告" : "サーバーで記録"}
                      {deviceOf(l.userAgent) && `・${deviceOf(l.userAgent)}`}
                    </span>
                  </p>
                  <p className="text-xs text-neutral-600">
                    {l.talentName && (
                      <Link href={hrefWith({ talentId: l.talentId ?? undefined })} className="underline underline-offset-4 hover:text-neutral-950">
                        {l.talentName}
                      </Link>
                    )}
                    {l.jobTitle && (
                      <>
                        {l.talentName && " ・ "}
                        <Link href={hrefWith({ jobId: l.jobId ?? undefined })} className="underline underline-offset-4 hover:text-neutral-950">
                          {l.jobTitle}
                        </Link>
                      </>
                    )}
                    {l.fieldLabel && <span> ・ 項目「{l.fieldLabel}」</span>}
                  </p>
                  {l.message && <p className="break-words text-xs text-neutral-500">{l.message}</p>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
