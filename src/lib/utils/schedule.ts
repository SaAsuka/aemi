import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  format,
} from "date-fns"

export type ScheduleItem = {
  id: string
  date: string
  startTime: string | null
  endTime: string | null
  location: string | null
  status: string
  talentId: string
  talentName: string
  jobId: string
  jobTitle: string
}

export type DayCell = {
  date: Date
  dateStr: string
  isCurrentMonth: boolean
  isToday: boolean
  schedules: ScheduleItem[]
}

export type JobColor = {
  bg: string
  text: string
  ring: string
  name: string
}

export type CalendarData = {
  weeks: DayCell[][]
  jobColorMap: Map<string, JobColor>
  conflictScheduleIds: Set<string>
}

const COLOR_PALETTE: JobColor[] = [
  { bg: "bg-blue-100", text: "text-blue-800", ring: "ring-blue-300", name: "青" },
  { bg: "bg-emerald-100", text: "text-emerald-800", ring: "ring-emerald-300", name: "緑" },
  { bg: "bg-purple-100", text: "text-purple-800", ring: "ring-purple-300", name: "紫" },
  { bg: "bg-amber-100", text: "text-amber-800", ring: "ring-amber-300", name: "黄" },
  { bg: "bg-rose-100", text: "text-rose-800", ring: "ring-rose-300", name: "赤" },
  { bg: "bg-cyan-100", text: "text-cyan-800", ring: "ring-cyan-300", name: "水色" },
  { bg: "bg-indigo-100", text: "text-indigo-800", ring: "ring-indigo-300", name: "藍" },
  { bg: "bg-lime-100", text: "text-lime-800", ring: "ring-lime-300", name: "黄緑" },
  { bg: "bg-pink-100", text: "text-pink-800", ring: "ring-pink-300", name: "桃" },
  { bg: "bg-teal-100", text: "text-teal-800", ring: "ring-teal-300", name: "碧" },
]

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number)
  return h * 60 + m
}

function hasTimeOverlap(a: ScheduleItem, b: ScheduleItem): boolean {
  if (!a.startTime || !a.endTime || !b.startTime || !b.endTime) return true
  const aStart = timeToMinutes(a.startTime)
  const aEnd = timeToMinutes(a.endTime)
  const bStart = timeToMinutes(b.startTime)
  const bEnd = timeToMinutes(b.endTime)
  return aStart < bEnd && bStart < aEnd
}

export function buildCalendarData(
  schedules: ScheduleItem[],
  currentMonth: string
): CalendarData {
  const [year, month] = currentMonth.split("-").map(Number)
  const monthDate = new Date(year, month - 1, 1)
  const monthStart = startOfMonth(monthDate)
  const monthEnd = endOfMonth(monthDate)
  const calStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })

  const allDays = eachDayOfInterval({ start: calStart, end: calEnd })

  const schedulesByDate = new Map<string, ScheduleItem[]>()
  for (const s of schedules) {
    const dateKey = s.date.slice(0, 10)
    const arr = schedulesByDate.get(dateKey) ?? []
    arr.push(s)
    schedulesByDate.set(dateKey, arr)
  }

  const jobColorMap = new Map<string, JobColor>()
  let colorIdx = 0
  for (const s of schedules) {
    if (!jobColorMap.has(s.jobId)) {
      jobColorMap.set(s.jobId, COLOR_PALETTE[colorIdx % COLOR_PALETTE.length])
      colorIdx++
    }
  }

  const conflictScheduleIds = new Set<string>()
  for (const [, daySchedules] of schedulesByDate) {
    for (let i = 0; i < daySchedules.length; i++) {
      for (let j = i + 1; j < daySchedules.length; j++) {
        const a = daySchedules[i]
        const b = daySchedules[j]
        if (
          a.talentId === b.talentId &&
          a.status !== "CANCELLED" &&
          b.status !== "CANCELLED" &&
          hasTimeOverlap(a, b)
        ) {
          conflictScheduleIds.add(a.id)
          conflictScheduleIds.add(b.id)
        }
      }
    }
  }

  const weeks: DayCell[][] = []
  let currentWeek: DayCell[] = []
  for (const day of allDays) {
    const dateStr = format(day, "yyyy-MM-dd")
    currentWeek.push({
      date: day,
      dateStr,
      isCurrentMonth: isSameMonth(day, monthDate),
      isToday: isToday(day),
      schedules: schedulesByDate.get(dateStr) ?? [],
    })
    if (currentWeek.length === 7) {
      weeks.push(currentWeek)
      currentWeek = []
    }
  }
  if (currentWeek.length > 0) {
    weeks.push(currentWeek)
  }

  return { weeks, jobColorMap, conflictScheduleIds }
}
