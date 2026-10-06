"use client"

import { useState } from "react"
import { AlertTriangle, CalendarX2, Clock, MapPin } from "lucide-react"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { ScheduleCell } from "./schedule-cell"
import { ScheduleBar, SCHEDULE_STYLE } from "./schedule-bar"
import { ScheduleDetailDialog } from "./schedule-detail-dialog"
import { buildCalendarData } from "@/lib/utils/schedule"
import type { ScheduleItem, DayCell } from "@/lib/utils/schedule"
import { SCHEDULE_STATUS_LABELS } from "@/types"

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"]
const LEGEND = ["CONFIRMED", "COMPLETED", "NO_SHOW", "CANCELLED"] as const

function formatDay(date: Date) {
  return `${date.getMonth() + 1}月${date.getDate()}日（${WEEKDAYS[date.getDay()]}）`
}

function timeLabel(s: ScheduleItem) {
  if (!s.startTime && !s.endTime) return "時間未定"
  return `${s.startTime ?? ""}${s.endTime ? `〜${s.endTime}` : s.startTime ? "〜" : ""}`
}

export function ScheduleCalendar({
  schedules,
  currentMonth,
  hasFilters,
}: {
  schedules: ScheduleItem[]
  currentMonth: string
  hasFilters: boolean
}) {
  const { weeks, conflictScheduleIds } = buildCalendarData(schedules, currentMonth)
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

  const counts = LEGEND.map((st) => ({ status: st, count: schedules.filter((s) => s.status === st).length }))
  // スマホ用：この月の、予定がある日だけを並べる
  const agendaDays = weeks.flat().filter((c) => c.isCurrentMonth && c.schedules.length > 0)

  return (
    <>
      <section aria-label="スケジュール" className="overflow-clip rounded-xl border border-neutral-200 bg-white">
        {/* 件数と色の見方 */}
        <div className="flex flex-col gap-2 border-b border-neutral-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <p className="text-sm text-neutral-700">
            この月の予定 <span className="font-semibold text-neutral-950">{schedules.length}件</span>
            {hasFilters && <span className="ml-1.5 text-xs text-neutral-500">（絞り込み中）</span>}
            {conflictScheduleIds.size > 0 && (
              <span className="ml-3 inline-flex items-center gap-1 text-xs font-medium text-red-600">
                <AlertTriangle className="size-3.5" aria-hidden="true" />
                時間が重なっている予定が{conflictScheduleIds.size}件あります
              </span>
            )}
          </p>
          <ul className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-600" aria-label="色の見方">
            {counts.map(({ status, count }) => (
              <li key={status} className="flex items-center gap-1.5">
                <span className={cn("inline-block size-3 rounded-sm ring-1 ring-black/10", SCHEDULE_STYLE[status].split(" ").filter((c) => c.startsWith("bg-")).join(" "))} aria-hidden="true" />
                {SCHEDULE_STATUS_LABELS[status]} {count}
              </li>
            ))}
            <li className="flex items-center gap-1.5">
              <span className="inline-block size-3 rounded-sm ring-2 ring-red-500 ring-offset-1" aria-hidden="true" />
              重なり
            </li>
          </ul>
        </div>

        {/* 広い画面：カレンダー */}
        <div className="hidden md:block">
          <div className="grid grid-cols-7 border-b border-neutral-200 bg-neutral-50">
            {WEEKDAYS.map((d, i) => (
              <div
                key={d}
                className={cn(
                  "py-2 text-center text-xs font-medium",
                  i === 0 ? "text-red-600" : i === 6 ? "text-blue-600" : "text-neutral-500"
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
                  conflictIds={conflictScheduleIds}
                  onSelectSchedule={handleSelect}
                  onShowAll={handleShowAll}
                />
              ))
            )}
          </div>
        </div>

        {/* スマホ：日付ごとの一覧 */}
        <div className="md:hidden">
          {agendaDays.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <CalendarX2 className="mx-auto size-8 text-neutral-300" aria-hidden="true" />
              <p className="mt-3 text-sm text-neutral-500">この月の予定はありません</p>
            </div>
          ) : (
            <ol className="divide-y divide-neutral-200">
              {agendaDays.map((cell) => (
                <li key={cell.dateStr}>
                  <h3
                    className={cn(
                      "sticky -top-3 z-[1] flex items-center gap-2 bg-neutral-50 px-4 py-2 text-xs font-semibold",
                      cell.date.getDay() === 0 ? "text-red-600" : cell.date.getDay() === 6 ? "text-blue-600" : "text-neutral-700"
                    )}
                  >
                    {formatDay(cell.date)}
                    {cell.isToday && (
                      <span className="rounded-full bg-neutral-950 px-2 py-px text-[10px] font-semibold text-white">今日</span>
                    )}
                  </h3>
                  <ul className="divide-y divide-neutral-100">
                    {cell.schedules.map((s) => {
                      const conflict = conflictScheduleIds.has(s.id)
                      return (
                        <li key={s.id}>
                          <button
                            type="button"
                            onClick={() => handleSelect(s)}
                            className="flex w-full items-start gap-3 px-4 py-3 text-left active:bg-neutral-100"
                          >
                            <span
                              className={cn(
                                "mt-0.5 inline-flex h-6 shrink-0 items-center rounded-full px-2.5 text-xs font-medium",
                                SCHEDULE_STYLE[s.status] ?? SCHEDULE_STYLE.CONFIRMED
                              )}
                            >
                              {SCHEDULE_STATUS_LABELS[s.status] ?? s.status}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className={cn("block text-sm font-medium text-neutral-950", s.status === "CANCELLED" && "text-neutral-400 line-through")}>
                                {s.talentName}
                              </span>
                              <span className="mt-0.5 block truncate text-xs text-neutral-600">{s.jobTitle}</span>
                              <span className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-neutral-500">
                                <span className="inline-flex items-center gap-1 tabular-nums">
                                  <Clock className="size-3.5" aria-hidden="true" />
                                  {timeLabel(s)}
                                </span>
                                {s.location && (
                                  <span className="inline-flex min-w-0 items-center gap-1">
                                    <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
                                    <span className="truncate">{s.location}</span>
                                  </span>
                                )}
                              </span>
                              {conflict && (
                                <span className="mt-1 flex items-center gap-1 text-xs font-medium text-red-600">
                                  <AlertTriangle className="size-3.5" aria-hidden="true" />
                                  同じタレントの予定と時間が重なっています
                                </span>
                              )}
                            </span>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>

      <ScheduleDetailDialog
        schedule={selected}
        isConflict={selected ? conflictScheduleIds.has(selected.id) : false}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />

      <Dialog open={allOpen} onOpenChange={setAllOpen}>
        <DialogContent className="gap-0 bg-white p-6 sm:max-w-md">
          <DialogTitle className="text-lg font-semibold">{allCell ? formatDay(allCell.date) : ""}の予定</DialogTitle>
          <p className="mt-1 text-sm text-neutral-500">押すと詳しい内容と、状況の変更ができます。</p>
          <div className="mt-4 space-y-1.5">
            {allCell?.schedules.map((s) => (
              <ScheduleBar
                key={s.id}
                schedule={s}
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
