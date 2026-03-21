"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export function MonthNav({ currentMonth }: { currentMonth: string }) {
  const router = useRouter()

  function navigate(offset: number) {
    const [year, month] = currentMonth.split("-").map(Number)
    const d = new Date(year, month - 1 + offset, 1)
    const next = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    router.push(`?month=${next}`)
  }

  const [year, month] = currentMonth.split("-")

  return (
    <div className="flex items-center gap-2 sm:gap-4">
      <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
        前月
      </Button>
      <span className="font-medium">
        {year}年{parseInt(month)}月
      </span>
      <Button variant="outline" size="sm" onClick={() => navigate(1)}>
        翌月
      </Button>
    </div>
  )
}
