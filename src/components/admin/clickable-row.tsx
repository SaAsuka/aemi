"use client"

import { useRouter } from "next/navigation"
import { TableRow } from "@/components/ui/table"

export function ClickableRow({
  href,
  className,
  children,
}: {
  href: string
  className?: string
  children: React.ReactNode
}) {
  const router = useRouter()

  return (
    <TableRow
      className={`cursor-pointer ${className ?? ""}`}
      onClick={(e) => {
        const target = e.target as HTMLElement
        if (target.closest("a, button")) return
        router.push(href)
      }}
    >
      {children}
    </TableRow>
  )
}
