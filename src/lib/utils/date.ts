import { differenceInYears } from "date-fns"

export function calcAge(birthDate: Date): number {
  return differenceInYears(new Date(), birthDate)
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  return d.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  return d.toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function isEndOfDay(d: Date): boolean {
  return d.getHours() === 23 && d.getMinutes() === 59
}

export function formatDeadline(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  return isEndOfDay(d) ? formatDate(d) : formatDateTime(d)
}

export function formatShortDeadline(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  const base = `${d.getMonth() + 1}/${d.getDate()}`
  if (isEndOfDay(d)) return base
  return `${base} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
}

export function normalizeDeadline(value: string): Date {
  if (value.length === 10) {
    return new Date(`${value}T23:59:59`)
  }
  return new Date(value)
}
