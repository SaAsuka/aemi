"use client"

import { useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ChevronDown, Loader2 } from "lucide-react"
import { FIELD } from "@/components/admin/styles"

// 案件管理：選んだタレントの条件（性別・年齢・身長）に合う案件だけを表示する
export function JobTalentMatchSelect({
  talents,
  defaultValue,
}: {
  talents: { id: string; name: string }[]
  defaultValue?: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set("talentId", value)
    else params.delete("talentId")
    params.delete("page")
    startTransition(() => router.push(`?${params.toString()}`))
  }

  return (
    <div className="min-w-0 sm:w-64">
      <label htmlFor="job-talent-match" className="mb-1.5 block text-xs font-medium text-neutral-600">
        タレントに合う案件だけ表示
      </label>
      <div className="relative">
        <select
          id="job-talent-match"
          defaultValue={defaultValue ?? ""}
          onChange={(e) => handleChange(e.target.value)}
          aria-busy={isPending}
          className={`${FIELD} appearance-none pr-9 ${isPending ? "opacity-60" : ""}`}
        >
          <option value="">指定しない</option>
          {talents.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        {isPending ? (
          <Loader2 className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-neutral-500" aria-hidden="true" />
        ) : (
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-neutral-500" aria-hidden="true" />
        )}
      </div>
    </div>
  )
}
