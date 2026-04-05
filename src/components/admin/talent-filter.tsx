"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useTransition } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type TalentOption = {
  id: string
  name: string
}

export function TalentFilter({
  talents,
  defaultValue,
}: {
  talents: TalentOption[]
  defaultValue?: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  function handleChange(value: string | null) {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== "ALL") {
      params.set("talentId", value)
    } else {
      params.delete("talentId")
    }
    startTransition(() => {
      router.push(`?${params.toString()}`)
    })
  }

  return (
    <Select defaultValue={defaultValue ?? "ALL"} onValueChange={handleChange}>
      <SelectTrigger className={`w-full sm:w-48 ${isPending ? "opacity-50" : ""}`}>
        <SelectValue>{(v) => {
          if (v === "ALL") return "タレントで絞込"
          return talents.find((t) => t.id === v)?.name ?? v
        }}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="ALL">すべて</SelectItem>
        {talents.map((t) => (
          <SelectItem key={t.id} value={t.id}>
            {t.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
