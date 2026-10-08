"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ChevronLeft, ChevronRight } from "lucide-react"

// 月の切り替え（絞り込みの条件は残したまま月だけ変える）
export function MonthNav({ currentMonth }: { currentMonth: string }) {
  const searchParams = useSearchParams()
  const [year, month] = currentMonth.split("-").map(Number)
  const now = new Date()
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`

  const hrefFor = (offset: number | "today") => {
    const params = new URLSearchParams(searchParams.toString())
    if (offset === "today") {
      params.delete("month")
    } else {
      const d = new Date(year, month - 1 + offset, 1)
      params.set("month", `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`)
    }
    const qs = params.toString()
    return qs ? `?${qs}` : "?"
  }

  const btn =
    "inline-flex h-9 items-center gap-1 rounded-lg border border-neutral-300 bg-white px-3 text-sm font-medium text-neutral-800 transition-colors hover:border-neutral-400 hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950/30"

  return (
    <div className="flex items-center gap-2">
      <Link href={hrefFor(-1)} className={btn} aria-label="前の月">
        <ChevronLeft className="size-4" aria-hidden="true" />
        <span className="hidden sm:inline">前の月</span>
      </Link>
      <h2 className="min-w-[7.5rem] text-center text-lg font-semibold tabular-nums text-neutral-950" aria-live="polite">
        {year}年{month}月
      </h2>
      <Link href={hrefFor(1)} className={btn} aria-label="次の月">
        <span className="hidden sm:inline">次の月</span>
        <ChevronRight className="size-4" aria-hidden="true" />
      </Link>
      {currentMonth !== thisMonth && (
        <Link href={hrefFor("today")} className={`${btn} ml-1`}>
          今月に戻る
        </Link>
      )}
    </div>
  )
}
