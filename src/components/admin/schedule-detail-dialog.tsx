"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { AlertCircle, AlertTriangle, Briefcase, Clock, Loader2, MapPin, Pencil, StickyNote, Trash2, User } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { ScheduleStatusSelect } from "@/components/admin/schedule-status-select"
import { useConfirm } from "@/components/admin/confirm-dialog"
import { BTN_GHOST, BTN_PRIMARY, BTN_SECONDARY, FIELD } from "@/components/admin/styles"
import { deleteSchedule, updateSchedule } from "@/lib/actions/schedule"
import type { ScheduleItem, JobColor } from "@/lib/utils/schedule"

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"]

function formatDate(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number)
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay()
  return `${y}年${m}月${d}日（${WEEKDAYS[dow]}）`
}

export function ScheduleDetailDialog({
  schedule,
  isConflict,
  open,
  onOpenChange,
}: {
  schedule: ScheduleItem | null
  // 以前は案件ごとの色を使っていた（今は使わない）
  color?: JobColor | null
  isConflict: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [editing, setEditing] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSaving, startSave] = useTransition()
  const [isDeleting, startDelete] = useTransition()
  const [confirm, confirmDialog] = useConfirm()
  const router = useRouter()

  if (!schedule) return null

  // 閉じるときは、変更の途中だったものを元に戻す
  function handleOpenChange(next: boolean) {
    if (!next) {
      setEditing(false)
      setErrors({})
    }
    onOpenChange(next)
  }

  function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!schedule || isSaving) return
    const fd = new FormData(e.currentTarget)
    const errs: Record<string, string> = {}
    if (!fd.get("date")) errs.date = "日付を選んでください"
    const start = String(fd.get("startTime") ?? "")
    const end = String(fd.get("endTime") ?? "")
    if (start && end && start > end) errs.endTime = "終了は開始より後の時刻にしてください"
    setErrors(errs)
    if (Object.keys(errs).length) return
    const id = schedule.id
    startSave(async () => {
      const res = await updateSchedule(id, fd)
      if (res && "error" in res && res.error) {
        const next: Record<string, string> = {}
        for (const [k, v] of Object.entries(res.error)) {
          const msg = Array.isArray(v) ? v[0] : String(v)
          if (msg) next[k === "date" || k === "endTime" ? k : "form"] = msg
        }
        setErrors(next)
        return
      }
      toast.success("予定を変更しました", { description: `${schedule.talentName}さん ／ ${schedule.jobTitle}` })
      handleOpenChange(false)
      router.refresh()
    })
  }

  async function handleDelete() {
    if (!schedule) return
    const ok = await confirm({
      title: "この予定を削除しますか？",
      description: `${formatDate(schedule.date)}　${schedule.talentName}さん ／ ${schedule.jobTitle}\n応募の「合格」はそのまま残ります。`,
      confirmLabel: "削除する",
      danger: true,
    })
    if (!ok) return
    const id = schedule.id
    startDelete(async () => {
      const res = await deleteSchedule(id)
      if (res && "error" in res && res.error) {
        toast.error("削除できませんでした", { description: String(res.error) })
        return
      }
      toast.success("予定を削除しました")
      handleOpenChange(false)
      router.refresh()
    })
  }

  const time =
    schedule.startTime || schedule.endTime
      ? `${schedule.startTime ?? ""}${schedule.endTime ? `〜${schedule.endTime}` : schedule.startTime ? "〜" : ""}`
      : "時間未定"

  const err = (key: string) =>
    errors[key] ? (
      <p className="mt-1.5 flex items-start gap-1 text-xs text-red-600">
        <AlertCircle className="mt-px size-3.5 shrink-0" aria-hidden="true" />
        {errors[key]}
      </p>
    ) : null

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="gap-0 bg-white p-6 sm:max-w-md">
          <DialogTitle className="text-lg font-semibold">{editing ? "予定を変更" : formatDate(schedule.date)}</DialogTitle>
          <DialogDescription className="mt-1 text-sm text-neutral-500">
            {editing ? `${schedule.talentName}さん ／ ${schedule.jobTitle}` : "予定の詳しい内容"}
          </DialogDescription>

          {editing ? (
            <form key={schedule.id} onSubmit={handleSave} noValidate className="mt-5 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label htmlFor="se-date" className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-neutral-900">
                    日付
                    <span className="rounded bg-red-600 px-1.5 py-px text-[10px] font-semibold leading-4 text-white">必須</span>
                  </label>
                  <input
                    id="se-date"
                    name="date"
                    type="date"
                    defaultValue={schedule.date.slice(0, 10)}
                    aria-invalid={Boolean(errors.date) || undefined}
                    className={FIELD}
                  />
                  {err("date")}
                </div>
                <div>
                  <label htmlFor="se-start" className="mb-1.5 block text-sm font-medium text-neutral-900">
                    開始
                  </label>
                  <input id="se-start" name="startTime" type="time" defaultValue={schedule.startTime ?? ""} className={FIELD} />
                </div>
                <div>
                  <label htmlFor="se-end" className="mb-1.5 block text-sm font-medium text-neutral-900">
                    終了
                  </label>
                  <input
                    id="se-end"
                    name="endTime"
                    type="time"
                    defaultValue={schedule.endTime ?? ""}
                    aria-invalid={Boolean(errors.endTime) || undefined}
                    className={FIELD}
                  />
                  {err("endTime")}
                </div>
              </div>
              <div>
                <label htmlFor="se-location" className="mb-1.5 block text-sm font-medium text-neutral-900">
                  場所
                </label>
                <input id="se-location" name="location" defaultValue={schedule.location ?? ""} placeholder="例: 渋谷スタジオ" className={FIELD} />
              </div>
              <div>
                <label htmlFor="se-note" className="mb-1.5 block text-sm font-medium text-neutral-900">
                  備考
                </label>
                <textarea
                  id="se-note"
                  name="note"
                  rows={3}
                  defaultValue={schedule.note ?? ""}
                  placeholder="集合時間・持ち物など"
                  className={`${FIELD} h-auto py-2 leading-relaxed`}
                />
              </div>
              {errors.form && (
                <p role="alert" className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                  <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  {errors.form}
                </p>
              )}
              <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  className={BTN_SECONDARY}
                  onClick={() => {
                    setEditing(false)
                    setErrors({})
                  }}
                >
                  やめる
                </button>
                <button type="submit" disabled={isSaving} className={`${BTN_PRIMARY} sm:px-6`}>
                  {isSaving ? (
                    <>
                      <Loader2 className="animate-spin" aria-hidden="true" />
                      保存中…
                    </>
                  ) : (
                    "変更を保存する"
                  )}
                </button>
              </div>
            </form>
          ) : (
            <>
              {isConflict && (
                <p role="alert" className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  同じタレントの別の予定と時間が重なっています。どちらかの時間を確認してください。
                </p>
              )}

              <dl className="mt-5 space-y-3 text-sm">
                <div className="flex gap-3">
                  <dt className="mt-0.5 shrink-0 text-neutral-400">
                    <User className="size-4" aria-hidden="true" />
                    <span className="sr-only">タレント</span>
                  </dt>
                  <dd>
                    <Link href={`/admin/talents/${schedule.talentId}`} className="font-medium text-neutral-950 underline-offset-4 hover:underline">
                      {schedule.talentName}
                    </Link>
                  </dd>
                </div>
                <div className="flex gap-3">
                  <dt className="mt-0.5 shrink-0 text-neutral-400">
                    <Briefcase className="size-4" aria-hidden="true" />
                    <span className="sr-only">案件</span>
                  </dt>
                  <dd>
                    <Link href={`/admin/jobs/${schedule.jobId}`} className="text-neutral-950 underline-offset-4 hover:underline">
                      {schedule.jobTitle}
                    </Link>
                  </dd>
                </div>
                <div className="flex gap-3">
                  <dt className="mt-0.5 shrink-0 text-neutral-400">
                    <Clock className="size-4" aria-hidden="true" />
                    <span className="sr-only">時間</span>
                  </dt>
                  <dd className="tabular-nums text-neutral-950">{time}</dd>
                </div>
                {schedule.location && (
                  <div className="flex gap-3">
                    <dt className="mt-0.5 shrink-0 text-neutral-400">
                      <MapPin className="size-4" aria-hidden="true" />
                      <span className="sr-only">場所</span>
                    </dt>
                    <dd className="text-neutral-950">{schedule.location}</dd>
                  </div>
                )}
                {schedule.note && (
                  <div className="flex gap-3">
                    <dt className="mt-0.5 shrink-0 text-neutral-400">
                      <StickyNote className="size-4" aria-hidden="true" />
                      <span className="sr-only">備考</span>
                    </dt>
                    <dd className="whitespace-pre-wrap leading-relaxed text-neutral-950">{schedule.note}</dd>
                  </div>
                )}
              </dl>

              <div className="mt-6 border-t border-neutral-100 pt-5">
                <p className="mb-2 text-sm font-medium text-neutral-900">状況</p>
                <ScheduleStatusSelect key={schedule.id} scheduleId={schedule.id} currentStatus={schedule.status} />
              </div>

              <div className="mt-6 flex flex-col-reverse gap-2 border-t border-neutral-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className={`${BTN_GHOST} text-red-600 hover:bg-red-50 hover:text-red-700`}
                >
                  {isDeleting ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Trash2 aria-hidden="true" />}
                  {isDeleting ? "削除中…" : "予定を削除"}
                </button>
                <button type="button" onClick={() => setEditing(true)} className={BTN_SECONDARY}>
                  <Pencil aria-hidden="true" />
                  日時・場所を変更
                </button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
      {confirmDialog}
    </>
  )
}
