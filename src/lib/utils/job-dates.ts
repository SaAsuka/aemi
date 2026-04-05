import { formatDate } from "./date"

type JobDateRecord = {
  type: string
  date: Date | string
}

export function firstDateByType(dates: JobDateRecord[], type: string): string | null {
  const d = dates.find((d) => d.type === type)
  return d ? formatDate(d.date) : null
}

export function datesByType(dates: JobDateRecord[], type: string): string[] {
  return dates.filter((d) => d.type === type).map((d) => formatDate(d.date))
}
