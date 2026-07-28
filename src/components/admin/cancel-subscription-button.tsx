"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { cancelSubscriptionAtPeriodEnd } from "@/lib/actions/stripe-sync"

export function CancelSubscriptionButton({ talentId }: { talentId: string }) {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function handleClick() {
    if (!confirm("期末解約を設定しますか？\n現在の契約期間終了後に自動で解約されます。")) return

    setLoading(true)
    const result = await cancelSubscriptionAtPeriodEnd(talentId)
    setLoading(false)

    if ("error" in result) {
      alert(`エラー: ${result.error}`)
      return
    }

    setDone(true)
  }

  if (done) {
    return <p className="text-[10px] text-orange-600 mt-1">解約予約済み</p>
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="text-[10px] text-red-600 hover:text-red-700 hover:bg-red-50 h-auto px-1 py-0.5 mt-1"
      onClick={handleClick}
      disabled={loading}
    >
      {loading ? "処理中..." : "期末解約"}
    </Button>
  )
}
