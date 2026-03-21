"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const filterFields = [
  { label: "身長(cm)", minKey: "heightMin", maxKey: "heightMax" },
  { label: "バスト", minKey: "bustMin", maxKey: "bustMax" },
  { label: "ウエスト", minKey: "waistMin", maxKey: "waistMax" },
  { label: "ヒップ", minKey: "hipMin", maxKey: "hipMax" },
  { label: "靴サイズ", minKey: "shoeMin", maxKey: "shoeMax" },
] as const

type FilterKey = (typeof filterFields)[number]["minKey"] | (typeof filterFields)[number]["maxKey"]
const allKeys: FilterKey[] = filterFields.flatMap((f) => [f.minKey, f.maxKey])

export function TalentFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  function handleApply(formData: FormData) {
    const params = new URLSearchParams()
    const q = searchParams.get("q")
    if (q) params.set("q", q)
    for (const key of allKeys) {
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

  const hasActive = allKeys.some((k) => searchParams.get(k))

  return (
    <form action={handleApply} className="rounded-lg border p-4 space-y-4">
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
      <div className="flex gap-2">
        <Button type="submit" size="sm">適用</Button>
        {hasActive && (
          <Button type="button" variant="ghost" size="sm" onClick={handleClear}>クリア</Button>
        )}
      </div>
    </form>
  )
}
