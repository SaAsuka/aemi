"use client"

import { useState } from "react"
import { syncStripeCustomers } from "@/lib/actions/stripe-sync"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"

export function StripeSyncButton() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  async function handleSync() {
    setLoading(true)
    setMessage(null)
    try {
      const res = await syncStripeCustomers()
      if ("error" in res) {
        setMessage({ type: "error", text: res.error })
      } else {
        setMessage({ type: "success", text: `${res.totalCustomers}顧客中 ${res.matched}名マッチ / ${res.updated}件更新` })
      }
    } catch (e) {
      setMessage({ type: "error", text: e instanceof Error ? e.message : "不明なエラー" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={handleSync} disabled={loading}>
        <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
        {loading ? "同期中..." : "Stripe同期"}
      </Button>
      {message && (
        <span className={`text-xs ${message.type === "error" ? "text-red-600" : "text-muted-foreground"}`}>
          {message.text}
        </span>
      )}
    </div>
  )
}
