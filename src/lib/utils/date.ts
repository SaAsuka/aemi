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
    timeZone: "Asia/Tokyo",
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
    timeZone: "Asia/Tokyo",
  })
}

function isEndOfDay(d: Date): boolean {
  const h = d.getUTCHours()
  const m = d.getUTCMinutes()
  return h === 14 && m === 59
}

export function formatDeadline(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  return isEndOfDay(d) ? formatDate(d) : formatDateTime(d)
}

export function formatShortDeadline(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  const jst = new Date(d.getTime() + 9 * 60 * 60 * 1000)
  const base = `${jst.getUTCMonth() + 1}/${jst.getUTCDate()}`
  if (isEndOfDay(d)) return base
  return `${base} ${String(jst.getUTCHours()).padStart(2, "0")}:${String(jst.getUTCMinutes()).padStart(2, "0")}`
}

export function normalizeDeadline(value: string): Date {
  if (value.length === 10) {
    return new Date(`${value}T23:59:59+09:00`)
  }
  if (!value.includes("+") && !value.includes("Z")) {
    return new Date(`${value}+09:00`)
  }
  return new Date(value)
}
