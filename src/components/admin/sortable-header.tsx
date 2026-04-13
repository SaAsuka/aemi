"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useTransition } from "react"
import { TableHead } from "@/components/ui/table"
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"

export function SortableHeader({
  column,
  label,
  className,
}: {
  column: string
  label: string
  className?: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const currentSort = searchParams.get("sort")
  const currentOrder = searchParams.get("order") ?? "desc"
  const isActive = currentSort === column

  function handleSort() {
    const params = new URLSearchParams(searchParams.toString())
    if (isActive && currentOrder === "asc") {
      params.delete("sort")
      params.delete("order")
    } else if (isActive) {
      params.set("order", "asc")
    } else {
      params.set("sort", column)
      params.set("order", "desc")
    }
    params.delete("page")
    startTransition(() => {
      router.push(`?${params.toString()}`)
    })
  }

  const Icon = isActive ? (currentOrder === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown

  return (
    <TableHead className={className}>
      <button
        onClick={handleSort}
        className={`inline-flex items-center gap-1 hover:text-foreground ${isPending ? "opacity-50" : ""} ${isActive ? "text-foreground font-semibold" : ""}`}
      >
        {label}
        <Icon className="h-3 w-3" />
      </button>
    </TableHead>
  )
}
