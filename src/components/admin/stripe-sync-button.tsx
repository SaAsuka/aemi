"use client"

import { useState } from "react"
import { syncStripeCustomers } from "@/lib/actions/stripe-sync"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"

export function StripeSyncButton() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ totalCustomers: number; matched: number; updated: number } | null>(null)

  async function handleSync() {
    setLoading(true)
    setResult(null)
    try {
      const res = await syncStripeCustomers()
      setResult(res)
    } catch (e) {
      console.error("Stripe同期エラー:", e)
      alert("Stripe同期に失敗しました")
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
      {result && (
        <span className="text-xs text-muted-foreground">
          {result.totalCustomers}顧客中 {result.matched}名マッチ / {result.updated}件更新
        </span>
      )}
    </div>
  )
}
