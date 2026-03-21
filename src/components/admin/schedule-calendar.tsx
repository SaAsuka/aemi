"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScheduleCell } from "./schedule-cell"
import { ScheduleBar } from "./schedule-bar"
import { ScheduleDetailDialog } from "./schedule-detail-dialog"
import { buildCalendarData } from "@/lib/utils/schedule"
import type { ScheduleItem, DayCell } from "@/lib/utils/schedule"

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"]

export function ScheduleCalendar({
  schedules,
  currentMonth,
  hasFilters,
}: {
  schedules: ScheduleItem[]
  currentMonth: string
  hasFilters: boolean
}) {
  const { weeks, jobColorMap, conflictScheduleIds } = buildCalendarData(
    schedules,
    currentMonth
  )
  const [selected, setSelected] = useState<ScheduleItem | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [allCell, setAllCell] = useState<DayCell | null>(null)
  const [allOpen, setAllOpen] = useState(false)

  function handleSelect(s: ScheduleItem) {
    setSelected(s)
    setDetailOpen(true)
  }

  function handleShowAll(cell: DayCell) {
    setAllCell(cell)
    setAllOpen(true)
  }

  const legendEntries = Array.from(jobColorMap.entries()).map(([jobId, color]) => {
    const schedule = schedules.find((s) => s.jobId === jobId)
    return { jobId, color, title: schedule?.jobTitle ?? "" }
  })

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>
            {currentMonth} のスケジュール（{schedules.length}件）
            {hasFilters && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                フィルタ中
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-2 sm:p-6">
          <div className="grid grid-cols-7 mb-1">
            {WEEKDAYS.map((d, i) => (
              <div
                key={d}
                className={cn(
                  "text-center text-xs sm:text-sm font-medium py-1",
                  i === 0 && "text-red-500",
                  i === 6 && "text-blue-500"
                )}
              >
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {weeks.flatMap((week) =>
              week.map((cell) => (
                <ScheduleCell
                  key={cell.dateStr}
                  cell={cell}
                  jobColorMap={jobColorMap}
                  conflictIds={conflictScheduleIds}
                  onSelectSchedule={handleSelect}
                  onShowAll={handleShowAll}
                />
              ))
            )}
          </div>
          {legendEntries.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              {legendEntries.map(({ jobId, color, title }) => (
                <span
                  key={jobId}
                  className={`${color.bg} ${color.text} rounded px-2 py-0.5`}
                >
                  {title}
                </span>
              ))}
              {conflictScheduleIds.size > 0 && (
                <span className="rounded px-2 py-0.5 ring-2 ring-red-500 text-red-500">
                  重複
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <ScheduleDetailDialog
        schedule={selected}
        color={selected ? (jobColorMap.get(selected.jobId) ?? null) : null}
        isConflict={selected ? conflictScheduleIds.has(selected.id) : false}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />

      <Dialog open={allOpen} onOpenChange={setAllOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{allCell?.dateStr} のスケジュール</DialogTitle>
          </DialogHeader>
          <div className="space-y-1">
            {allCell?.schedules.map((s) => (
              <ScheduleBar
                key={s.id}
                schedule={s}
                color={jobColorMap.get(s.jobId)!}
                isConflict={conflictScheduleIds.has(s.id)}
                onClick={() => {
                  setAllOpen(false)
                  handleSelect(s)
                }}
              />
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
