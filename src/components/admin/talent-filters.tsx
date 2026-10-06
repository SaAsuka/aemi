"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ChevronDown, SlidersHorizontal } from "lucide-react"
import { BTN_GHOST, BTN_PRIMARY, BTN_SECONDARY, FIELD } from "@/components/admin/styles"

const filterFields = [
  { label: "身長", minKey: "heightMin", maxKey: "heightMax" },
  { label: "バスト", minKey: "bustMin", maxKey: "bustMax" },
  { label: "ウエスト", minKey: "waistMin", maxKey: "waistMax" },
  { label: "ヒップ", minKey: "hipMin", maxKey: "hipMax" },
  { label: "靴サイズ", minKey: "shoeMin", maxKey: "shoeMax" },
] as const

type FilterKey = (typeof filterFields)[number]["minKey"] | (typeof filterFields)[number]["maxKey"]
const allKeys: FilterKey[] = filterFields.flatMap((f) => [f.minKey, f.maxKey])

const selectKeys = ["line", "subscription"] as const

const lineOptions = [
  { value: "", label: "すべて" },
  { value: "connected", label: "連携済" },
  { value: "not_connected", label: "未連携" },
]

const subscriptionOptions = [
  { value: "", label: "すべて" },
  { value: "ACTIVE", label: "契約中" },
  { value: "NONE", label: "未契約" },
  { value: "PAST_DUE", label: "支払遅延" },
  { value: "CANCELED", label: "解約済" },
  { value: "UNPAID", label: "未払い" },
]

function SelectField({
  id,
  label,
  name,
  defaultValue,
  options,
}: {
  id: string
  label: string
  name: string
  defaultValue: string
  options: { value: string; label: string }[]
}) {
  return (
    <div className="min-w-0 sm:w-40">
      <label htmlFor={id} className="mb-1.5 block text-xs font-medium text-neutral-600">
        {label}
      </label>
      <div className="relative">
        <select id={id} name={name} defaultValue={defaultValue} className={`${FIELD} appearance-none pr-9`}>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-neutral-500"
          aria-hidden="true"
        />
      </div>
    </div>
  )
}

export function TalentFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeBodyCount = filterFields.filter((f) => searchParams.get(f.minKey) || searchParams.get(f.maxKey)).length
  const [showDetail, setShowDetail] = useState(activeBodyCount > 0)

  function handleApply(formData: FormData) {
    const params = new URLSearchParams()
    const q = searchParams.get("q")
    if (q) params.set("q", q)
    for (const key of allKeys) {
      const val = formData.get(key)
      if (val && String(val).trim()) params.set(key, String(val).trim())
    }
    for (const key of selectKeys) {
      const val = formData.get(key)
      if (val && String(val).trim()) params.set(key, String(val).trim())
    }
    router.push(`?${params.toString()}`)
  }

  function handleClear() {
    const params = new URLSearchParams()
    const q = searchParams.get("q")
    if (q) params.set("q", q)
    router.push(`?${params.toString()}`)
  }

  const hasActive = allKeys.some((k) => searchParams.get(k)) || selectKeys.some((k) => searchParams.get(k))

  return (
    <form action={handleApply} noValidate>
      <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:items-end">
        <SelectField
          id="filter-line"
          label="LINE"
          name="line"
          defaultValue={searchParams.get("line") ?? ""}
          options={lineOptions}
        />
        <SelectField
          id="filter-subscription"
          label="決済"
          name="subscription"
          defaultValue={searchParams.get("subscription") ?? ""}
          options={subscriptionOptions}
        />
        <button
          type="button"
          onClick={() => setShowDetail(!showDetail)}
          aria-expanded={showDetail}
          aria-controls="talent-filter-detail"
          className={`${BTN_SECONDARY} col-span-2 sm:col-span-1`}
        >
          <SlidersHorizontal aria-hidden="true" />
          身長・サイズで絞り込む
          {activeBodyCount > 0 && (
            <span className="ml-0.5 inline-flex size-5 items-center justify-center rounded-full bg-neutral-950 text-[11px] font-semibold text-white">
              {activeBodyCount}
            </span>
          )}
          <ChevronDown
            className={`transition-transform duration-150 ${showDetail ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
        </button>

        <div className="col-span-2 flex gap-2 sm:ml-auto">
          {hasActive && (
            <button type="button" onClick={handleClear} className={`${BTN_GHOST} flex-1 sm:flex-none`}>
              条件をクリア
            </button>
          )}
          <button type="submit" className={`${BTN_PRIMARY} flex-1 sm:flex-none sm:px-5`}>
            絞り込む
          </button>
        </div>
      </div>

      {showDetail && (
        <div
          id="talent-filter-detail"
          className="mt-4 grid grid-cols-1 gap-4 border-t border-neutral-100 pt-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5"
        >
          {filterFields.map((field) => (
            <fieldset key={field.minKey} className="min-w-0">
              <legend className="mb-1.5 text-xs font-medium text-neutral-600">
                {field.label}
                <span className="ml-1 font-normal text-neutral-400">（cm）</span>
              </legend>
              <div className="flex items-center gap-2">
                <input
                  name={field.minKey}
                  type="number"
                  inputMode="decimal"
                  placeholder="以上"
                  aria-label={`${field.label}（cm）以上`}
                  defaultValue={searchParams.get(field.minKey) ?? ""}
                  className={FIELD}
                  step="any"
                />
                <span className="shrink-0 text-xs text-neutral-400" aria-hidden="true">
                  〜
                </span>
                <input
                  name={field.maxKey}
                  type="number"
                  inputMode="decimal"
                  placeholder="以下"
                  aria-label={`${field.label}（cm）以下`}
                  defaultValue={searchParams.get(field.maxKey) ?? ""}
                  className={FIELD}
                  step="any"
                />
              </div>
            </fieldset>
          ))}
        </div>
      )}
    </form>
  )
}
