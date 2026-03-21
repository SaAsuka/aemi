"use client"

import { cn } from "@/lib/utils"
import { ScheduleBar } from "./schedule-bar"
import type { DayCell, JobColor, ScheduleItem } from "@/lib/utils/schedule"

export function ScheduleCell({
  cell,
  jobColorMap,
  conflictIds,
  onSelectSchedule,
  onShowAll,
}: {
  cell: DayCell
  jobColorMap: Map<string, JobColor>
  conflictIds: Set<string>
  onSelectSchedule: (s: ScheduleItem) => void
  onShowAll: (cell: DayCell) => void
}) {
  const day = cell.date.getDate()
  const dow = cell.date.getDay()
  const hasConflict = cell.schedules.some((s) => conflictIds.has(s.id))
  const visibleDesktop = cell.schedules.slice(0, 3)
  const visibleMobile = cell.schedules.slice(0, 2)
  const overflowDesktop = cell.schedules.length - 3
  const overflowMobile = cell.schedules.length - 2

  return (
    <div
      className={cn(
        "min-h-[60px] sm:min-h-[90px] border border-border p-0.5 sm:p-1",
        !cell.isCurrentMonth && "bg-muted/30",
        cell.isToday && "bg-blue-50"
      )}
    >
      <div
        className={cn(
          "text-xs sm:text-sm font-medium mb-0.5",
          !cell.isCurrentMonth && "text-muted-foreground",
          dow === 0 && "text-red-500",
          dow === 6 && "text-blue-500"
        )}
      >
        {day}
      </div>
      <div className="space-y-0.5">
        <div className="hidden sm:block space-y-0.5">
          {visibleDesktop.map((s) => (
            <ScheduleBar
              key={s.id}
              schedule={s}
              color={jobColorMap.get(s.jobId)!}
              isConflict={conflictIds.has(s.id)}
              onClick={() => onSelectSchedule(s)}
            />
          ))}
          {overflowDesktop > 0 && (
            <button
              type="button"
              onClick={() => onShowAll(cell)}
              className="text-[10px] text-muted-foreground hover:text-foreground"
            >
              +{overflowDesktop}件
            </button>
          )}
        </div>
        <div className="sm:hidden space-y-0.5">
          {visibleMobile.map((s) => (
            <ScheduleBar
              key={s.id}
              schedule={s}
              color={jobColorMap.get(s.jobId)!}
              isConflict={conflictIds.has(s.id)}
              onClick={() => onSelectSchedule(s)}
            />
          ))}
          {overflowMobile > 0 && (
            <button
              type="button"
              onClick={() => onShowAll(cell)}
              className="text-[10px] text-muted-foreground hover:text-foreground"
            >
              +{overflowMobile}件
            </button>
          )}
        </div>
      </div>
      {hasConflict && (
        <p className="text-[9px] text-red-500 mt-0.5">重複あり</p>
      )}
    </div>
  )
}
