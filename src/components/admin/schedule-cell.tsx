"use client"

import { cn } from "@/lib/utils"
import { ScheduleBar } from "./schedule-bar"
import type { DayCell, ScheduleItem } from "@/lib/utils/schedule"

const VISIBLE = 3

// カレンダーの1日分（PC・タブレット用）
export function ScheduleCell({
  cell,
  conflictIds,
  onSelectSchedule,
  onShowAll,
}: {
  cell: DayCell
  conflictIds: Set<string>
  onSelectSchedule: (s: ScheduleItem) => void
  onShowAll: (cell: DayCell) => void
}) {
  const day = cell.date.getDate()
  const dow = cell.date.getDay()
  const visible = cell.schedules.slice(0, VISIBLE)
  const overflow = cell.schedules.length - VISIBLE

  return (
    <div
      className={cn(
        "min-h-28 border-b border-r border-neutral-200 p-1.5 [&:nth-child(7n)]:border-r-0",
        !cell.isCurrentMonth && "bg-neutral-50/70"
      )}
    >
      <div className="mb-1 flex items-center justify-between px-0.5">
        <span
          className={cn(
            "inline-flex size-6 items-center justify-center rounded-full text-xs font-medium tabular-nums",
            cell.isToday
              ? "bg-neutral-950 text-white"
              : !cell.isCurrentMonth
                ? "text-neutral-300"
                : dow === 0
                  ? "text-red-600"
                  : dow === 6
                    ? "text-blue-600"
                    : "text-neutral-700"
          )}
          aria-label={cell.isToday ? `${day}日（今日）` : undefined}
        >
          {day}
        </span>
      </div>
      <div className="space-y-1">
        {visible.map((s) => (
          <ScheduleBar key={s.id} schedule={s} isConflict={conflictIds.has(s.id)} onClick={() => onSelectSchedule(s)} />
        ))}
        {overflow > 0 && (
          <button
            type="button"
            onClick={() => onShowAll(cell)}
            className="w-full rounded-md px-1.5 py-0.5 text-left text-xs font-medium text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950"
          >
            ほか{overflow}件
          </button>
        )}
      </div>
    </div>
  )
}
