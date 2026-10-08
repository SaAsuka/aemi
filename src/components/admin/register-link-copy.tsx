"use client"

import { useState } from "react"
import { Link2, Check, Loader2, AlertCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { BTN_PRIMARY, BTN_SECONDARY } from "@/components/admin/styles"
import { copyText } from "@/lib/utils/clipboard"

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

export function RegisterLinkCopy({ className = BTN_SECONDARY }: { className?: string }) {
  const [open, setOpen] = useState(false)
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  // 自動でコピーできなかったプラン（URLを画面に出して、長押しでコピーしてもらう）
  const [copyFailed, setCopyFailed] = useState<string | null>(null)

  const openDialog = async () => {
    setCopyFailed(null)
    setOpen(true)
    setLoading(true)
    try {
      const res = await fetch("/api/stripe/plans")
      if (res.ok) setPlans(await res.json())
    } finally {
      setLoading(false)
    }
  }

  const urlOf = (token: string) => `${window.location.origin}/register?t=${token}`

  const copy = async (token: string, button: HTMLElement) => {
    const ok = await copyText(urlOf(token), button.parentElement)
    if (!ok) {
      setCopied(null)
      setCopyFailed(token)
      return
    }
    setCopyFailed(null)
    setCopied(token)
    setTimeout(() => {
      setCopied(null)
      setOpen(false)
    }, 1500)
  }

  return (
    <>
      <button type="button" onClick={openDialog} className={className}>
        <Link2 aria-hidden="true" />
        登録フォームURL
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="gap-0 bg-white p-6 sm:max-w-md">
          <DialogTitle className="text-lg font-semibold">登録フォームのURLをコピー</DialogTitle>
          <DialogDescription className="mt-1.5 text-sm text-neutral-500">
            プランを選ぶと、そのプランで登録できるURLをコピーします。LINEやメールに貼り付けて送ってください。
          </DialogDescription>

          <div className="mt-5">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-10 text-sm text-neutral-500">
                <Loader2 className="size-5 animate-spin" aria-hidden="true" />
                プランを読み込んでいます…
              </div>
            ) : plans.length === 0 ? (
              <p className="rounded-lg bg-neutral-50 py-8 text-center text-sm text-neutral-500">
                プランが見つかりませんでした
              </p>
            ) : (
              <ul className="space-y-3">
                {plans.map((plan) => {
                  const isCopied = copied === plan.token
                  return (
                    <li key={plan.token} className="rounded-xl border border-neutral-200 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-neutral-950">{plan.name}</p>
                          {plan.description && (
                            <p className="mt-0.5 text-xs text-neutral-500">{plan.description}</p>
                          )}
                        </div>
                        <p className="whitespace-nowrap text-sm font-semibold text-neutral-950">
                          {formatAmount(plan.amount, plan.currency)}
                          <span className="text-xs font-normal text-neutral-500">
                            /{INTERVAL_LABELS[plan.interval] ?? plan.interval}
                          </span>
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => copy(plan.token, e.currentTarget)}
                        className={`${isCopied ? `${BTN_SECONDARY} text-green-700` : BTN_PRIMARY} mt-3 w-full`}
                      >
                        {isCopied ? (
                          <>
                            <Check aria-hidden="true" />
                            コピーしました
                          </>
                        ) : (
                          <>
                            <Link2 aria-hidden="true" />
                            このプランのURLをコピー
                          </>
                        )}
                      </button>
                      {copyFailed === plan.token && (
                        <div className="mt-3 rounded-lg bg-yellow-50 p-3">
                          <p role="alert" className="flex items-start gap-1.5 text-xs text-yellow-800">
                            <AlertCircle className="mt-px size-4 shrink-0" aria-hidden="true" />
                            このブラウザでは自動でコピーできませんでした。下のURLを長押し（パソコンは右クリック）してコピーしてください。
                          </p>
                          <textarea
                            readOnly
                            rows={2}
                            value={urlOf(plan.token)}
                            aria-label={`${plan.name}の登録フォームURL`}
                            onFocus={(e) => e.currentTarget.select()}
                            className="mt-2 block w-full resize-none break-all rounded-lg border border-neutral-300 bg-white px-3 py-2 font-mono text-base text-neutral-950 focus-visible:border-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950/10 sm:text-sm"
                          />
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
