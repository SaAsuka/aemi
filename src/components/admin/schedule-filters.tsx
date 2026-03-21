"use client"

import { useRouter, useSearchParams } from "next/navigation"
import {
  SearchableSelect,
  type ComboboxOption,
} from "@/components/ui/searchable-select"
import { Label } from "@/components/ui/label"

export function ScheduleFilters({
  talentOptions,
  jobOptions,
}: {
  talentOptions: ComboboxOption[]
  jobOptions: ComboboxOption[]
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const talent = searchParams.get("talent")
  const job = searchParams.get("job")

  function navigate(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <Label className="text-xs">タレント名</Label>
        <SearchableSelect
          options={talentOptions}
          value={talent}
          onValueChange={(v) => navigate("talent", v)}
          placeholder="タレントで絞り込み"
          className="w-48"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">案件名</Label>
        <SearchableSelect
          options={jobOptions}
          value={job}
          onValueChange={(v) => navigate("job", v)}
          placeholder="案件で絞り込み"
          className="w-48"
        />
      </div>
    </div>
  )
}
