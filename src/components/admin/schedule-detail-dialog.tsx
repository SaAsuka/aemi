"use client"

import Link from "next/link"
import { AlertTriangle, Briefcase, Clock, MapPin, User } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { ScheduleStatusSelect } from "@/components/admin/schedule-status-select"
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
  if (!schedule) return null

  const time =
    schedule.startTime || schedule.endTime
      ? `${schedule.startTime ?? ""}${schedule.endTime ? `〜${schedule.endTime}` : schedule.startTime ? "〜" : ""}`
      : "時間未定"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 bg-white p-6 sm:max-w-md">
        <DialogTitle className="text-lg font-semibold">{formatDate(schedule.date)}</DialogTitle>
        <DialogDescription className="mt-1 text-sm text-neutral-500">予定の詳しい内容</DialogDescription>

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
        </dl>

        <div className="mt-6 border-t border-neutral-100 pt-5">
          <p className="mb-2 text-sm font-medium text-neutral-900">状況</p>
          <ScheduleStatusSelect key={schedule.id} scheduleId={schedule.id} currentStatus={schedule.status} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
