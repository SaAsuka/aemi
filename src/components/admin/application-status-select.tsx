"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { AlertCircle, Check, ChevronDown, Loader2 } from "lucide-react"
import { updateApplicationStatus } from "@/lib/actions/application"
import { createSchedule } from "@/lib/actions/schedule"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { BTN_PRIMARY, BTN_SECONDARY, FIELD } from "@/components/admin/styles"

// 色は他の画面の札と同じ：応募済み＝青・書類送付済＝黄・合格＝緑・不合格＝赤・キャンセル＝グレー
const statuses = [
  { value: "APPLIED", label: "応募済み", desc: "まだ選考していない", bg: "bg-blue-600" },
  { value: "RESUME_SENT", label: "書類送付済", desc: "制作会社に書類を送った", bg: "bg-yellow-700" },
  { value: "ACCEPTED", label: "合格", desc: "出演が決まった", bg: "bg-green-700" },
  { value: "REJECTED", label: "不合格", desc: "今回は見送り", bg: "bg-red-600" },
  { value: "CANCELLED", label: "キャンセル", desc: "応募を取り下げた", bg: "bg-neutral-500" },
]

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"]
// 予定の日付は日付だけを保存している（UTCの0時）ので、UTCのまま読む
function formatScheduleDate(date: Date | string) {
  const d = new Date(date)
  return `${d.getUTCMonth() + 1}月${d.getUTCDate()}日（${WEEKDAYS[d.getUTCDay()]}）`
}

const CHIP =
  "inline-flex h-7 w-full items-center justify-between gap-1 whitespace-nowrap rounded-full pl-3 pr-2 text-xs font-medium text-white"

export function ApplicationStatusSelect({
  applicationId,
  currentStatus,
  scheduleDate = null,
  talentName,
  jobTitle,
}: {
  applicationId: string
  currentStatus: string
  // すでに登録されている予定の日付（あれば、合格にしても予定登録の小窓は出さない）
  scheduleDate?: Date | string | null
  talentName: string
  jobTitle: string
}) {
  const [isPending, startTransition] = useTransition()
  const [showScheduleDialog, setShowScheduleDialog] = useState(false)
  const [scheduleErrors, setScheduleErrors] = useState<Record<string, string>>({})
  const [isSubmitting, startSubmit] = useTransition()
  const router = useRouter()

  function handleChange(value: string | null) {
    if (!value) return
    const label = statuses.find((st) => st.value === value)?.label ?? value
    startTransition(async () => {
      const res = await updateApplicationStatus(applicationId, value)
      if (res && "error" in res && res.error) {
        toast.error("選考の状況を変えられませんでした", { description: String(res.error) })
        return
      }
      if (value === "ACCEPTED" && scheduleDate) {
        toast.success("「合格」にしました", {
          description: `予定は登録済みです（${formatScheduleDate(scheduleDate)}）。変えるときはスケジュールのページから。`,
        })
        return
      }
      toast.success(`「${label}」にしました`, { description: `${talentName}さん ／ ${jobTitle}` })
      if (value === "ACCEPTED") {
        setScheduleErrors({})
        setShowScheduleDialog(true)
      }
    })
  }

  // フォームの action に渡すと送信後に入力欄が空になる（React 19）ため、ここで受け取って送る
  function handleScheduleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (isSubmitting) return
    const formData = new FormData(e.currentTarget)
    const errs: Record<string, string> = {}
    if (!formData.get("date")) errs.date = "日付を選んでください"
    const start = String(formData.get("startTime") ?? "")
    const end = String(formData.get("endTime") ?? "")
    if (start && end && start > end) errs.endTime = "終了は開始より後の時刻にしてください"
    setScheduleErrors(errs)
    if (Object.keys(errs).length) return
    formData.set("applicationId", applicationId)
    formData.set("status", "CONFIRMED")
    startSubmit(async () => {
      const result = await createSchedule(formData)
      if (result.error) {
        const next: Record<string, string> = {}
        for (const [k, v] of Object.entries(result.error)) {
          const msg = Array.isArray(v) ? v[0] : String(v)
          if (msg) next[k === "date" || k === "endTime" ? k : "form"] = msg
        }
        setScheduleErrors(next)
        return
      }
      toast.success("予定を登録しました", { description: `${talentName}さん ／ ${jobTitle}` })
      setShowScheduleDialog(false)
      router.refresh()
    })
  }

  const fieldError = (key: string) =>
    scheduleErrors[key] ? (
      <p className="mt-1.5 flex items-start gap-1 text-xs text-red-600">
        <AlertCircle className="mt-px size-3.5 shrink-0" aria-hidden="true" />
        {scheduleErrors[key]}
      </p>
    ) : null

  const current = statuses.find((s) => s.value === currentStatus)

  // 自動不合格（締切から7日たっても応募済みのままだと自動で付く）は、ここでは変えられない
  if (currentStatus === "AUTO_REJECTED") {
    return (
      <span className={`${CHIP} bg-red-600`} title="締切から7日たっても選考されなかったため、自動で不合格になりました">
        自動不合格
      </span>
    )
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          disabled={isPending}
          aria-label={`選考の状況：${current?.label ?? currentStatus}（押すと変えられます）`}
          className={`${CHIP} transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950/30 focus-visible:ring-offset-1 disabled:opacity-70 ${
            current?.bg ?? "bg-neutral-500"
          }`}
        >
          {current?.label ?? currentStatus}
          {isPending ? <Loader2 className="size-3.5 animate-spin" aria-hidden="true" /> : <ChevronDown className="size-3.5" aria-hidden="true" />}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56 bg-white p-1">
          <p className="px-2 pb-1 pt-1.5 text-xs text-neutral-500">選考の状況を変える</p>
          {statuses.map((s) => {
            const active = s.value === currentStatus
            return (
              <DropdownMenuItem
                key={s.value}
                onClick={() => {
                  if (!active) handleChange(s.value)
                }}
                className="items-start gap-2.5 rounded-md px-2 py-2 focus:bg-neutral-100"
              >
                <span className={`mt-1 size-2.5 shrink-0 rounded-full ${s.bg}`} aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className={`block text-sm ${active ? "font-semibold text-neutral-950" : "text-neutral-900"}`}>{s.label}</span>
                  <span className="block text-xs text-neutral-500">{s.desc}</span>
                </span>
                {active && <Check className="mt-0.5 size-4 text-neutral-950" aria-label="いまの状況" />}
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent className="gap-0 bg-white p-6 sm:max-w-lg">
          <DialogTitle className="text-lg font-semibold">撮影などの予定を登録</DialogTitle>
          <DialogDescription className="mt-1.5 text-sm text-neutral-500">
            {talentName}さん ／ {jobTitle}
          </DialogDescription>
          <form onSubmit={handleScheduleSubmit} noValidate className="mt-5 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor={`as-date-${applicationId}`} className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-neutral-900">
                  日付
                  <span className="rounded bg-red-600 px-1.5 py-px text-[10px] font-semibold leading-4 text-white">必須</span>
                </label>
                <input
                  id={`as-date-${applicationId}`}
                  name="date"
                  type="date"
                  aria-invalid={Boolean(scheduleErrors.date) || undefined}
                  className={FIELD}
                />
                {fieldError("date")}
              </div>
              <div>
                <label htmlFor={`as-start-${applicationId}`} className="mb-1.5 block text-sm font-medium text-neutral-900">
                  開始
                </label>
                <input id={`as-start-${applicationId}`} name="startTime" type="time" className={FIELD} />
              </div>
              <div>
                <label htmlFor={`as-end-${applicationId}`} className="mb-1.5 block text-sm font-medium text-neutral-900">
                  終了
                </label>
                <input
                  id={`as-end-${applicationId}`}
                  name="endTime"
                  type="time"
                  aria-invalid={Boolean(scheduleErrors.endTime) || undefined}
                  className={FIELD}
                />
                {fieldError("endTime")}
              </div>
            </div>
            <div>
              <label htmlFor={`as-location-${applicationId}`} className="mb-1.5 block text-sm font-medium text-neutral-900">
                場所
              </label>
              <input id={`as-location-${applicationId}`} name="location" placeholder="例: 渋谷スタジオ" className={FIELD} />
            </div>
            <div>
              <label htmlFor={`as-note-${applicationId}`} className="mb-1.5 block text-sm font-medium text-neutral-900">
                備考
              </label>
              <textarea id={`as-note-${applicationId}`} name="note" rows={3} placeholder="集合時間・持ち物など" className={`${FIELD} h-auto py-2 leading-relaxed`} />
            </div>
            {scheduleErrors.form && (
              <p role="alert" className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                {scheduleErrors.form}
              </p>
            )}
            <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
              <button type="button" className={BTN_SECONDARY} onClick={() => setShowScheduleDialog(false)}>
                あとで登録する
              </button>
              <button type="submit" disabled={isSubmitting} className={`${BTN_PRIMARY} sm:px-6`}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin" aria-hidden="true" />
                    登録中…
                  </>
                ) : (
                  "予定を登録する"
                )}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
