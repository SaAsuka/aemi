"use client"

import { useState } from "react"
import { toast } from "sonner"
import { syncStripeCustomers } from "@/lib/actions/stripe-sync"
import { RefreshCw } from "lucide-react"
import { BTN_SECONDARY } from "@/components/admin/styles"

export function StripeSyncButton({ className = BTN_SECONDARY }: { className?: string }) {
  const [loading, setLoading] = useState(false)

  async function handleSync() {
    setLoading(true)
    try {
      const res = await syncStripeCustomers()
      if ("error" in res) {
        toast.error("Stripeとの同期に失敗しました", { description: res.error })
      } else {
        toast.success("Stripeと同期しました", {
          description: `${res.totalCustomers}件の顧客のうち ${res.matched}名が一致し、${res.updated}件を更新しました`,
        })
      }
    } catch (e) {
      toast.error("Stripeとの同期に失敗しました", {
        description: e instanceof Error ? e.message : "不明なエラー",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleSync}
      disabled={loading}
      title="Stripeの契約状況をタレント情報に反映します"
      className={className}
    >
      <RefreshCw className={loading ? "animate-spin" : ""} aria-hidden="true" />
      {loading ? "同期中…" : "Stripe同期"}
    </button>
  )
}
