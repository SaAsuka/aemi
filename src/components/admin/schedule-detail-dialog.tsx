"use client"

import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { StatusBadge } from "@/components/admin/status-badge"
import { ScheduleStatusSelect } from "@/components/admin/schedule-status-select"
import { SCHEDULE_STATUS_LABELS } from "@/types"
import type { ScheduleItem, JobColor } from "@/lib/utils/schedule"

export function ScheduleDetailDialog({
  schedule,
  color,
  isConflict,
  open,
  onOpenChange,
}: {
  schedule: ScheduleItem | null
  color: JobColor | null
  isConflict: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  if (!schedule) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>スケジュール詳細</DialogTitle>
        </DialogHeader>
        {isConflict && (
          <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
            同一タレントの時間重複が発生しています
          </div>
        )}
        <div className="space-y-3 text-sm">
          <div>
            <span className="text-muted-foreground">案件：</span>
            <Link
              href={`/admin/jobs/${schedule.jobId}`}
              className="hover:underline font-medium"
            >
              {schedule.jobTitle}
            </Link>
          </div>
          <div>
            <span className="text-muted-foreground">タレント：</span>
            <Link
              href={`/admin/talents/${schedule.talentId}`}
              className="hover:underline font-medium"
            >
              {schedule.talentName}
            </Link>
          </div>
          <div>
            <span className="text-muted-foreground">日時：</span>
            {schedule.date.slice(0, 10)}
            {schedule.startTime && ` ${schedule.startTime}`}
            {schedule.endTime && `〜${schedule.endTime}`}
          </div>
          {schedule.location && (
            <div>
              <span className="text-muted-foreground">場所：</span>
              {schedule.location}
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">ステータス：</span>
            <StatusBadge
              status={schedule.status}
              label={SCHEDULE_STATUS_LABELS[schedule.status] ?? schedule.status}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">変更：</span>
            <ScheduleStatusSelect
              scheduleId={schedule.id}
              currentStatus={schedule.status}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
