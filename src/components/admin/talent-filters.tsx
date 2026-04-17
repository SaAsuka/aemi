"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ChevronDown, ChevronUp } from "lucide-react"

const filterFields = [
  { label: "身長(cm)", minKey: "heightMin", maxKey: "heightMax" },
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

export function TalentFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const hasBodyFilters = allKeys.some((k) => searchParams.get(k))
  const [showDetail, setShowDetail] = useState(hasBodyFilters)

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
    <form action={handleApply} className="rounded-lg border p-4 space-y-3">
      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-1">
          <Label className="text-xs">LINE</Label>
          <select
            name="line"
            defaultValue={searchParams.get("line") ?? ""}
            className="h-8 rounded-md border bg-background px-2 text-sm"
          >
            {lineOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">決済</Label>
          <select
            name="subscription"
            defaultValue={searchParams.get("subscription") ?? ""}
            className="h-8 rounded-md border bg-background px-2 text-sm"
          >
            {subscriptionOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={() => setShowDetail(!showDetail)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground h-8"
        >
          詳細検索
          {showDetail ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>
      </div>
      {showDetail && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {filterFields.map((field) => (
            <div key={field.minKey} className="space-y-1">
              <Label className="text-xs">{field.label}</Label>
              <div className="flex items-center gap-1">
                <Input
                  name={field.minKey}
                  type="number"
                  placeholder="以上"
                  defaultValue={searchParams.get(field.minKey) ?? ""}
                  className="h-8 text-sm"
                  step="any"
                />
                <span className="text-muted-foreground text-xs">〜</span>
                <Input
                  name={field.maxKey}
                  type="number"
                  placeholder="以下"
                  defaultValue={searchParams.get(field.maxKey) ?? ""}
                  className="h-8 text-sm"
                  step="any"
                />
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <Button type="submit" size="sm">適用</Button>
        {hasActive && (
          <Button type="button" variant="ghost" size="sm" onClick={handleClear}>クリア</Button>
        )}
      </div>
    </form>
  )
}
