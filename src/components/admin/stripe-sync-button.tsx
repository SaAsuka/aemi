"use client"

import { useState } from "react"
import { syncStripeCustomers } from "@/lib/actions/stripe-sync"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"

type SyncResult = {
  step1?: string
  step2?: string
  step3?: string
  error?: string
  totalCustomers?: number
  matched?: number
  updated?: number
}

export function StripeSyncButton() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<SyncResult | null>(null)

  async function handleSync() {
    setLoading(true)
    setResult(null)
    try {
      const res = await syncStripeCustomers()
      setResult(res)
    } catch (e) {
      setResult({ error: e instanceof Error ? e.message : "不明なエラー" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={handleSync} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
          {loading ? "同期中..." : "Stripe同期"}
        </Button>
        {result && !result.error && result.totalCustomers !== undefined && (
          <span className="text-xs text-muted-foreground">
            {result.totalCustomers}顧客中 {result.matched}名マッチ / {result.updated}件更新
          </span>
        )}
      </div>
      {result && (result.step1 || result.step2 || result.step3 || result.error) && (
        <div className="text-xs space-y-0.5">
          {result.step1 && (
            <p className={result.step1.startsWith("OK") ? "text-green-600" : "text-red-600"}>
              Step1 キー確認: {result.step1}
            </p>
          )}
          {result.step2 && (
            <p className={result.step2.startsWith("OK") ? "text-green-600" : "text-red-600"}>
              Step2 接続テスト: {result.step2}
            </p>
          )}
          {result.step3 && (
            <p className={result.step3.startsWith("OK") ? "text-green-600" : "text-red-600"}>
              Step3 同期: {result.step3}
            </p>
          )}
          {result.error && !result.step1 && (
            <p className="text-red-600">{result.error}</p>
          )}
        </div>
      )}
    </div>
  )
}
