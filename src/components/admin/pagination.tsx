"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useTransition } from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

export function Pagination({
  total,
  pageSize = 50,
  className,
  buttonClassName,
}: {
  total: number
  pageSize?: number
  // 見た目を画面ごとに変えたいとき用（未指定なら従来どおり）
  className?: string
  buttonClassName?: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const page = Math.max(1, Number(searchParams.get("page")) || 1)
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  function goTo(p: number) {
    const params = new URLSearchParams(searchParams.toString())
    if (p <= 1) {
      params.delete("page")
    } else {
      params.set("page", String(p))
    }
    startTransition(() => {
      router.push(`?${params.toString()}`)
    })
  }

  if (total <= pageSize) return null

  return (
    <div className={cn("flex items-center justify-between px-2 py-3 text-sm", isPending && "opacity-50", className)}>
      <span className="text-muted-foreground">
        {from}〜{to}件 / 全{total}件
      </span>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => goTo(page - 1)}
          disabled={page <= 1}
          className={buttonClassName}
          aria-label="前のページ"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="px-2">{page} / {totalPages}</span>
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => goTo(page + 1)}
          disabled={page >= totalPages}
          className={buttonClassName}
          aria-label="次のページ"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
