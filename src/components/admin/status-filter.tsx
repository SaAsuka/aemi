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

export function StatusFilter({
  options,
  defaultValue,
}: {
  options: { value: string; label: string }[]
  defaultValue?: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  function handleChange(value: string | null) {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== "ALL") {
      params.set("status", value)
    } else {
      params.delete("status")
    }
    startTransition(() => {
      router.push(`?${params.toString()}`)
    })
  }

  return (
    <Select defaultValue={defaultValue ?? "ALL"} onValueChange={handleChange}>
      <SelectTrigger className={`w-full sm:w-40 ${isPending ? "opacity-50" : ""}`}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
