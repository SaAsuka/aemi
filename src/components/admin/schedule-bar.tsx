"use client"

import { cn } from "@/lib/utils"
import type { ScheduleItem, JobColor } from "@/lib/utils/schedule"

export function ScheduleBar({
  schedule,
  color,
  isConflict,
  onClick,
}: {
  schedule: ScheduleItem
  color: JobColor
  isConflict: boolean
  onClick: () => void
}) {
  const isCancelled = schedule.status === "CANCELLED"

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full rounded px-1 py-0.5 text-left text-[10px] leading-tight truncate sm:text-xs",
        color.bg,
        color.text,
        isConflict && "ring-2 ring-red-500",
        isCancelled && "opacity-40 line-through"
      )}
    >
      <span className="hidden sm:inline">
        {schedule.startTime && `${schedule.startTime} `}
        {schedule.talentName}
      </span>
      <span className="sm:hidden">{schedule.talentName.charAt(0)}</span>
    </button>
  )
}
