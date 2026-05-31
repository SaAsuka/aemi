"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { syncFreeePartners } from "@/lib/actions/production-company"

export function FreeeSyncButton() {
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)
  const router = useRouter()

  function handleSync() {
    setMessage(null)
    startTransition(async () => {
      const result = await syncFreeePartners()
      if (result.error) {
        setMessage(result.error)
      } else {
        setMessage(`同期完了: ${result.created}件追加（Freee取引先: ${result.synced}件）`)
        router.refresh()
      }
    })
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleSync}
        disabled={isPending}
        className="gap-1"
      >
        <RefreshCw className={`h-3.5 w-3.5 ${isPending ? "animate-spin" : ""}`} />
        {isPending ? "同期中..." : "Freee同期"}
      </Button>
      {message && (
        <span className={`text-xs ${message.includes("失敗") || message.includes("未連携") ? "text-destructive" : "text-muted-foreground"}`}>
          {message}
        </span>
      )}
    </div>
  )
}
