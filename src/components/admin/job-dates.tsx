"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { AlertCircle, CalendarPlus, ChevronDown, Loader2, MapPin, Trash2 } from "lucide-react"
import { addJobDate, deleteJobDate } from "@/lib/actions/job"
import { BTN_PRIMARY, BTN_SECONDARY, FIELD } from "@/components/admin/styles"

type JobDateItem = {
  id: string
  type: string
  date: Date
  startTime: string | null
  endTime: string | null
  location: string | null
  note: string | null
}

const TYPE_LABELS: Record<string, string> = { AUDITION: "オーディション", SHOOTING: "撮影", OTHER: "その他" }
const TYPE_TONE: Record<string, string> = {
  AUDITION: "bg-blue-600",
  SHOOTING: "bg-neutral-950",
  OTHER: "bg-neutral-500",
}

// 日付は日付として保存されているので、日本の曜日付きで表示する
function formatDay(date: Date) {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "UTC",
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(new Date(date))
}

const EMPTY = { type: "AUDITION", date: "", startTime: "", endTime: "", location: "", note: "" }

export function JobDates({ jobId, dates }: { jobId: string; dates: JobDateItem[] }) {
  const router = useRouter()
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const set = (key: keyof typeof EMPTY, value: string) => {
    setForm((f) => ({ ...f, [key]: value }))
    if (errors[key])
      setErrors((prev) => {
        const next = { ...prev }
        delete next[key]
        return next
      })
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!form.date) {
      setErrors({ date: "日付を選んでください" })
      return
    }
    setSaving(true)
    const res = await addJobDate(jobId, form)
    setSaving(false)
    if ("error" in res && res.error) {
      setErrors(res.error)
      return
    }
    toast.success(`${TYPE_LABELS[form.type]}の日程を追加しました`)
    setForm(EMPTY)
    setAdding(false)
    startTransition(() => router.refresh())
  }

  async function handleDelete(item: JobDateItem) {
    if (!window.confirm(`${TYPE_LABELS[item.type] ?? "日程"}（${formatDay(item.date)}）を削除しますか？`)) return
    setDeletingId(item.id)
    const res = await deleteJobDate(item.id)
    setDeletingId(null)
    if ("error" in res && res.error) {
      toast.error("削除できませんでした", { description: res.error })
      return
    }
    toast.success("日程を削除しました")
    startTransition(() => router.refresh())
  }

  return (
    <div className="space-y-4">
      {dates.length === 0 && !adding && (
        <p className="rounded-lg bg-neutral-50 px-4 py-6 text-center text-sm text-neutral-500">
          まだ日程がありません。オーディション日や撮影日を追加すると、タレントの案件ページにも表示されます。
        </p>
      )}

      {dates.length > 0 && (
        <ul className="divide-y divide-neutral-100 rounded-xl border border-neutral-200">
          {dates.map((d) => (
            <li key={d.id} className="flex items-start gap-3 px-4 py-3">
              <span
                className={`mt-0.5 inline-flex h-6 shrink-0 items-center rounded-full px-2.5 text-xs font-medium text-white ${TYPE_TONE[d.type] ?? "bg-neutral-500"}`}
              >
                {TYPE_LABELS[d.type] ?? d.type}
              </span>
              <div className="min-w-0 flex-1 text-sm">
                <p className="font-medium text-neutral-950">
                  {formatDay(d.date)}
                  {(d.startTime || d.endTime) && (
                    <span className="ml-2 font-normal tabular-nums text-neutral-700">
                      {d.startTime ?? ""}
                      {d.endTime ? `〜${d.endTime}` : d.startTime ? "〜" : ""}
                    </span>
                  )}
                </p>
                {d.location && (
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-neutral-500">
                    <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
                    {d.location}
                  </p>
                )}
                {d.note && <p className="mt-0.5 whitespace-pre-wrap text-xs text-neutral-500">{d.note}</p>}
              </div>
              <button
                type="button"
                onClick={() => handleDelete(d)}
                disabled={deletingId === d.id}
                aria-label={`${TYPE_LABELS[d.type] ?? "日程"}（${formatDay(d.date)}）を削除`}
                className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-neutral-400 transition-colors hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600/30 disabled:opacity-50"
              >
                {deletingId === d.id ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Trash2 className="size-4" aria-hidden="true" />}
              </button>
            </li>
          ))}
        </ul>
      )}

      {adding ? (
        <form onSubmit={handleAdd} noValidate className="space-y-4 rounded-xl border border-neutral-300 p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="jd-type" className="mb-1.5 block text-sm font-medium text-neutral-900">
                種類
              </label>
              <div className="relative">
                <select id="jd-type" value={form.type} onChange={(e) => set("type", e.target.value)} className={`${FIELD} appearance-none pr-9`}>
                  <option value="AUDITION">オーディション</option>
                  <option value="SHOOTING">撮影</option>
                  <option value="OTHER">その他</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-neutral-500" aria-hidden="true" />
              </div>
            </div>
            <div>
              <label htmlFor="jd-date" className="mb-1.5 block text-sm font-medium text-neutral-900">
                日付
              </label>
              <input
                id="jd-date"
                type="date"
                value={form.date}
                onChange={(e) => set("date", e.target.value)}
                aria-invalid={Boolean(errors.date) || undefined}
                className={FIELD}
              />
              {errors.date && (
                <p className="mt-1.5 flex items-start gap-1 text-xs text-red-600">
                  <AlertCircle className="mt-px size-3.5 shrink-0" aria-hidden="true" />
                  {errors.date}
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="jd-start" className="mb-1.5 block text-sm font-medium text-neutral-900">
                  開始
                </label>
                <input id="jd-start" type="time" value={form.startTime} onChange={(e) => set("startTime", e.target.value)} className={FIELD} />
              </div>
              <div>
                <label htmlFor="jd-end" className="mb-1.5 block text-sm font-medium text-neutral-900">
                  終了
                </label>
                <input
                  id="jd-end"
                  type="time"
                  value={form.endTime}
                  onChange={(e) => set("endTime", e.target.value)}
                  aria-invalid={Boolean(errors.endTime) || undefined}
                  className={FIELD}
                />
              </div>
              {(errors.endTime || errors.startTime) && (
                <p className="col-span-2 flex items-start gap-1 text-xs text-red-600">
                  <AlertCircle className="mt-px size-3.5 shrink-0" aria-hidden="true" />
                  {errors.endTime ?? errors.startTime}
                </p>
              )}
              <p className="col-span-2 text-xs text-neutral-500">時刻は空欄でも追加できます</p>
            </div>
            <div>
              <label htmlFor="jd-location" className="mb-1.5 block text-sm font-medium text-neutral-900">
                場所
              </label>
              <input
                id="jd-location"
                value={form.location}
                onChange={(e) => set("location", e.target.value)}
                placeholder="例: 渋谷スタジオ"
                className={FIELD}
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="jd-note" className="mb-1.5 block text-sm font-medium text-neutral-900">
                メモ
              </label>
              <input id="jd-note" value={form.note} onChange={(e) => set("note", e.target.value)} placeholder="例: 集合は開始の15分前" className={FIELD} />
            </div>
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              className={BTN_SECONDARY}
              onClick={() => {
                setAdding(false)
                setForm(EMPTY)
                setErrors({})
              }}
            >
              キャンセル
            </button>
            <button type="submit" className={BTN_PRIMARY} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="animate-spin" aria-hidden="true" />
                  追加中…
                </>
              ) : (
                "この日程を追加"
              )}
            </button>
          </div>
        </form>
      ) : (
        <button type="button" className={`${BTN_SECONDARY} w-full sm:w-auto`} onClick={() => setAdding(true)}>
          <CalendarPlus aria-hidden="true" />
          日程を追加
        </button>
      )}
    </div>
  )
}
