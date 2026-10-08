"use client"

import { useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ChevronDown, Loader2 } from "lucide-react"
import { FIELD } from "@/components/admin/styles"

// タレントを選んで一覧を絞り込む（URL の talentId を切り替える）
// 案件管理では「そのタレントの条件に合う案件」、応募管理では「そのタレントの応募」に絞り込む
export function JobTalentMatchSelect({
  talents,
  defaultValue,
  id = "job-talent-match",
  label = "タレントに合う案件だけ表示",
  emptyLabel = "指定しない",
}: {
  talents: { id: string; name: string }[]
  defaultValue?: string
  id?: string
  label?: string
  emptyLabel?: string
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
      <label htmlFor={id} className="mb-1.5 block text-xs font-medium text-neutral-600">
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          defaultValue={defaultValue ?? ""}
          onChange={(e) => handleChange(e.target.value)}
          aria-busy={isPending}
          className={`${FIELD} appearance-none pr-9 ${isPending ? "opacity-60" : ""}`}
        >
          <option value="">{emptyLabel}</option>
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
