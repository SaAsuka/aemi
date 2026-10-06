"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Check, ChevronDown, Loader2 } from "lucide-react"
import { updateInvoiceStatus } from "@/lib/actions/invoice"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { BTN_SECONDARY } from "@/components/admin/styles"

// 色の意味は一覧のチップと同じ：下書き＝グレー・発行済＝青・送付済＝黄・入金済＝緑・取消＝赤
const STATUSES = [
  { value: "DRAFT", label: "下書き", desc: "まだ発行していない", bg: "bg-neutral-500" },
  { value: "ISSUED", label: "発行済", desc: "発行したが、まだ送っていない", bg: "bg-blue-600" },
  { value: "SENT", label: "送付済", desc: "制作会社に送った（入金待ち）", bg: "bg-yellow-700" },
  { value: "PAID", label: "入金済", desc: "入金を確認した", bg: "bg-green-700" },
  { value: "CANCELLED", label: "取消", desc: "この請求書を無効にする", bg: "bg-red-600" },
] as const

const labelOf = (v: string) => STATUSES.find((s) => s.value === v)?.label ?? v

// 請求書の状態を、一覧のチップから選んで変える（選んだ時点で保存される）
export function InvoiceStatusMenu({
  invoiceId,
  currentStatus,
  subject,
  hasFreee,
}: {
  invoiceId: string
  currentStatus: string
  subject: string
  // freee で発行した請求書か（取消のときの注意書きに使う）
  hasFreee: boolean
}) {
  const [status, setStatus] = useState(currentStatus)
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const current = STATUSES.find((s) => s.value === status)

  function change(next: string, prev: string, { undoable = true } = {}) {
    setStatus(next)
    startTransition(async () => {
      const res = await updateInvoiceStatus(invoiceId, next)
      if (res && "error" in res && res.error) {
        setStatus(prev)
        toast.error("状態を変えられませんでした", { description: String(res.error) })
        return
      }
      toast.success(`「${labelOf(next)}」にしました`, {
        description: subject,
        action: undoable ? { label: "元に戻す", onClick: () => change(prev, next, { undoable: false }) } : undefined,
      })
      router.refresh()
    })
  }

  function select(next: string) {
    if (next === status || isPending) return
    if (next === "CANCELLED") {
      setConfirmCancel(true)
      return
    }
    change(next, status)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          disabled={isPending}
          aria-label={`状態：${current?.label ?? status}（押すと変えられます）`}
          className={`inline-flex h-6 items-center gap-0.5 whitespace-nowrap rounded-full pl-2.5 pr-1.5 text-xs font-medium text-white transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950/30 focus-visible:ring-offset-1 disabled:opacity-70 ${
            current?.bg ?? "bg-neutral-500"
          }`}
        >
          {current?.label ?? status}
          {isPending ? <Loader2 className="size-3.5 animate-spin" aria-hidden="true" /> : <ChevronDown className="size-3.5" aria-hidden="true" />}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64 bg-white p-1">
          <p className="px-2 pb-1 pt-1.5 text-xs text-neutral-500">状態を変える</p>
          {STATUSES.map((s) => {
            const active = s.value === status
            return (
              <DropdownMenuItem
                key={s.value}
                onClick={() => select(s.value)}
                className="items-start gap-2.5 rounded-md px-2 py-2 focus:bg-neutral-100"
              >
                <span className={`mt-1 size-2.5 shrink-0 rounded-full ${s.bg}`} aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className={`block text-sm ${active ? "font-semibold text-neutral-950" : "text-neutral-900"}`}>{s.label}</span>
                  <span className="block text-xs text-neutral-500">{s.desc}</span>
                </span>
                {active && <Check className="mt-0.5 size-4 text-neutral-950" aria-label="いまの状態" />}
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* 取消は戻すと分かりにくいので、押す前に確認する */}
      <Dialog open={confirmCancel} onOpenChange={setConfirmCancel}>
        <DialogContent className="gap-0 bg-white p-6 sm:max-w-md">
          <DialogTitle className="text-lg font-semibold">この請求書を取消にしますか？</DialogTitle>
          <DialogDescription className="mt-2 text-sm leading-relaxed text-neutral-600">
            「{subject}」を取消にします。入金待ちの合計からも外れます。
          </DialogDescription>
          {hasFreee && (
            <p className="mt-4 rounded-lg bg-yellow-50 px-3 py-2.5 text-sm leading-relaxed text-yellow-900">
              freeeの請求書は取り消されません。freee側も取り消す場合は、freeeで操作してください。
            </p>
          )}
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" className={BTN_SECONDARY} onClick={() => setConfirmCancel(false)}>
              やめる
            </button>
            <button
              type="button"
              className="inline-flex h-9 items-center justify-center rounded-lg bg-red-600 px-4 text-sm font-medium text-white transition-colors hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600/30"
              onClick={() => {
                setConfirmCancel(false)
                change("CANCELLED", status)
              }}
            >
              取消にする
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
