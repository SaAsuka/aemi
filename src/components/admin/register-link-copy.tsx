"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Link2, Check, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type Plan = {
  token: string
  name: string
  description: string | null
  amount: number | null
  currency: string
  interval: string
}

function formatAmount(amount: number | null, currency: string) {
  if (amount === null) return "—"
  return new Intl.NumberFormat("ja-JP", { style: "currency", currency }).format(amount)
}

const INTERVAL_LABELS: Record<string, string> = {
  month: "月",
  year: "年",
  week: "週",
  day: "日",
}

export function RegisterLinkCopy() {
  const [open, setOpen] = useState(false)
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)

  const openDialog = async () => {
    setOpen(true)
    setLoading(true)
    try {
      const res = await fetch("/api/stripe/plans")
      if (res.ok) setPlans(await res.json())
    } finally {
      setLoading(false)
    }
  }

  const copy = (token: string) => {
    const url = `${window.location.origin}/register?t=${token}`
    navigator.clipboard.writeText(url)
    setCopied(token)
    setTimeout(() => {
      setCopied(null)
      setOpen(false)
    }, 1500)
  }

  return (
    <>
      <Button onClick={openDialog} variant="outline" size="sm">
        <Link2 className="h-4 w-4 mr-1" />
        登録フォームURL
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>プランを選択してURLを発行</DialogTitle>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : plans.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              プランが見つかりませんでした
            </p>
          ) : (
            <div className="space-y-3 pt-2">
              {plans.map((plan) => (
                <div key={plan.token} className="rounded-lg border p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-sm">{plan.name}</p>
                      {plan.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{plan.description}</p>
                      )}
                    </div>
                    <p className="text-sm font-bold whitespace-nowrap">
                      {formatAmount(plan.amount, plan.currency)}
                      <span className="text-xs font-normal text-muted-foreground">
                        /{INTERVAL_LABELS[plan.interval] ?? plan.interval}
                      </span>
                    </p>
                  </div>
                  <Button
                    size="sm"
                    className="w-full"
                    variant={copied === plan.token ? "secondary" : "default"}
                    onClick={() => copy(plan.token)}
                  >
                    {copied === plan.token ? (
                      <><Check className="h-4 w-4 mr-1" />コピー済み</>
                    ) : (
                      <><Link2 className="h-4 w-4 mr-1" />このプランのURLをコピー</>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
