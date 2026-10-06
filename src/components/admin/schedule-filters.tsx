"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { SearchableSelect, type ComboboxOption } from "@/components/ui/searchable-select"

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
    <div className="grid grid-cols-1 gap-3 sm:flex sm:flex-wrap sm:items-end">
      <div className="min-w-0 sm:w-60">
        <p className="mb-1.5 text-xs font-medium text-neutral-600">タレントで絞り込む</p>
        <SearchableSelect
          options={talentOptions}
          value={talent}
          onValueChange={(v) => navigate("talent", v)}
          placeholder="名前を入れて探す"
        />
      </div>
      <div className="min-w-0 sm:w-72">
        <p className="mb-1.5 text-xs font-medium text-neutral-600">案件で絞り込む</p>
        <SearchableSelect
          options={jobOptions}
          value={job}
          onValueChange={(v) => navigate("job", v)}
          placeholder="案件名を入れて探す"
        />
      </div>
    </div>
  )
}
