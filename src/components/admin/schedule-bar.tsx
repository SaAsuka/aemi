"use client"

import { cn } from "@/lib/utils"
import type { ScheduleItem, JobColor } from "@/lib/utils/schedule"

// 予定の状態ごとの見た目（確定＝黒・完了＝緑・無断欠席＝赤・キャンセル＝薄いグレーに取り消し線）
export const SCHEDULE_STYLE: Record<string, string> = {
  CONFIRMED: "bg-neutral-900 text-white hover:bg-neutral-700",
  COMPLETED: "bg-green-700 text-white hover:bg-green-800",
  NO_SHOW: "bg-red-600 text-white hover:bg-red-700",
  CANCELLED: "bg-neutral-100 text-neutral-400 line-through hover:bg-neutral-200",
}

export function ScheduleBar({
  schedule,
  isConflict,
  onClick,
}: {
  schedule: ScheduleItem
  // 以前は案件ごとの色を使っていた（今は状態で色分けするので使わない）
  color?: JobColor
  isConflict: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={`${schedule.talentName} ／ ${schedule.jobTitle}${isConflict ? "（同じタレントの予定と時間が重なっています）" : ""}`}
      className={cn(
        "block w-full truncate rounded-md px-1.5 py-1 text-left text-xs leading-tight transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950/40",
        SCHEDULE_STYLE[schedule.status] ?? SCHEDULE_STYLE.CONFIRMED,
        isConflict && "ring-2 ring-red-500 ring-offset-1"
      )}
    >
      {schedule.startTime && <span className="mr-1 tabular-nums opacity-80">{schedule.startTime}</span>}
      {schedule.talentName}
    </button>
  )
}
