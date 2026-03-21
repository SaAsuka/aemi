"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function ScheduleFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  function handleApply(formData: FormData) {
    const params = new URLSearchParams()
    const month = searchParams.get("month")
    if (month) params.set("month", month)
    const talent = formData.get("talent")
    if (talent && String(talent).trim()) params.set("talent", String(talent).trim())
    const job = formData.get("job")
    if (job && String(job).trim()) params.set("job", String(job).trim())
    router.push(`?${params.toString()}`)
  }

  function handleClear() {
    const params = new URLSearchParams()
    const month = searchParams.get("month")
    if (month) params.set("month", month)
    router.push(`?${params.toString()}`)
  }

  const hasActive = searchParams.get("talent") || searchParams.get("job")

  return (
    <form action={handleApply} className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <Label className="text-xs">タレント名</Label>
        <Input
          name="talent"
          placeholder="タレント名で絞り込み"
          defaultValue={searchParams.get("talent") ?? ""}
          className="h-8 w-44 text-sm"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">案件名</Label>
        <Input
          name="job"
          placeholder="案件名で絞り込み"
          defaultValue={searchParams.get("job") ?? ""}
          className="h-8 w-44 text-sm"
        />
      </div>
      <Button type="submit" size="sm">絞り込み</Button>
      {hasActive && (
        <Button type="button" variant="ghost" size="sm" onClick={handleClear}>クリア</Button>
      )}
    </form>
  )
}
