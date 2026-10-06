"use client"

import { useState, useTransition } from "react"
import { useConfirm } from "@/components/admin/confirm-dialog"
import { toast } from "sonner"
import { ChevronDown, Loader2, Trash2, X } from "lucide-react"
import { bulkUpdateApplicationStatus, bulkDeleteApplications } from "@/lib/actions/application"

const STATUS_OPTIONS = [
  { value: "APPLIED", label: "応募済み" },
  { value: "RESUME_SENT", label: "書類送付済" },
  { value: "ACCEPTED", label: "合格" },
  { value: "REJECTED", label: "不合格" },
  { value: "CANCELLED", label: "キャンセル" },
]
// 1件ずつ変えたときはLINEでお知らせが届く状況（まとめて変えたときは届かない）
const LINE_NOTIFY_STATUSES = new Set(["RESUME_SENT", "ACCEPTED", "REJECTED"])
const NO_LINE_NOTE = "まとめて変えたときは、タレントにLINEのお知らせは届きません。"

// 応募を選ぶと画面の下に出る、まとめて操作するためのバー
export function BulkActionsBar({
  selectedIds,
  onClear,
}: {
  selectedIds: string[]
  onClear: () => void
}) {
  const [isPending, startTransition] = useTransition()
  const [bulkStatus, setBulkStatus] = useState("")
  const [confirm, confirmDialog] = useConfirm()

  if (selectedIds.length === 0) return null

  function handleBulkStatusChange() {
    if (!bulkStatus) return
    const label = STATUS_OPTIONS.find((o) => o.value === bulkStatus)?.label ?? ""
    const count = selectedIds.length
    startTransition(async () => {
      await bulkUpdateApplicationStatus(selectedIds, bulkStatus)
      toast.success(`${count}件を「${label}」にしました`, {
        description: LINE_NOTIFY_STATUSES.has(bulkStatus) ? NO_LINE_NOTE : undefined,
      })
      onClear()
      setBulkStatus("")
    })
  }

  async function handleBulkDelete() {
    const count = selectedIds.length
    const ok = await confirm({
      title: `選んだ${count}件の応募を削除しますか？`,
      description: "提出された写真・動画も一緒に消え、元に戻せません。",
      confirmLabel: "削除する",
      danger: true,
    })
    if (!ok) return
    startTransition(async () => {
      await bulkDeleteApplications(selectedIds)
      toast.success(`${count}件の応募を削除しました`)
      onClear()
    })
  }

  return (
    <div className="sticky -bottom-3 z-20 -mx-px px-3 pb-3 sm:-bottom-6 sm:pb-4">
      <div
        role="region"
        aria-label="選んだ応募をまとめて操作"
        className="flex flex-col gap-3 rounded-xl bg-neutral-950 p-3 text-white shadow-2xl sm:flex-row sm:items-center"
      >
        <div className="flex items-center justify-between gap-2 sm:justify-start">
          <span className="text-sm font-medium">{selectedIds.length}件を選択中</span>
          <button
            type="button"
            onClick={onClear}
            className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-xs text-neutral-300 transition-colors hover:bg-white/10 hover:text-white sm:order-last"
          >
            <X className="size-4" aria-hidden="true" />
            選択をやめる
          </button>
        </div>
        <div className="flex flex-1 flex-wrap items-center gap-2 sm:justify-end">
          <div className="relative min-w-0 flex-1 sm:w-44 sm:flex-none">
            <label htmlFor="bulk-status" className="sr-only">
              変更後の状況
            </label>
            <select
              id="bulk-status"
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value)}
              className="h-9 w-full appearance-none rounded-lg border border-white/20 bg-white/10 pl-3 pr-9 text-base text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 sm:text-sm [&>option]:text-neutral-950"
            >
              <option value="">状況をまとめて変更…</option>
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-neutral-300" aria-hidden="true" />
          </div>
          <button
            type="button"
            onClick={handleBulkStatusChange}
            disabled={!bulkStatus || isPending}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-white px-4 text-sm font-medium text-neutral-950 transition-colors hover:bg-neutral-200 disabled:opacity-40"
          >
            {isPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
            変更する
          </button>
          <button
            type="button"
            onClick={handleBulkDelete}
            disabled={isPending}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-medium text-red-300 transition-colors hover:bg-red-500/15 hover:text-red-200 disabled:opacity-40"
          >
            <Trash2 className="size-4" aria-hidden="true" />
            削除
          </button>
        </div>
      </div>
      {/* 1件ずつ変えたときとの違い（LINEのお知らせ）を、変える前に伝える */}
      {LINE_NOTIFY_STATUSES.has(bulkStatus) && (
        <p className="mt-2 rounded-lg bg-yellow-50 px-3 py-2 text-xs leading-relaxed text-yellow-900 ring-1 ring-yellow-200">
          {NO_LINE_NOTE}お知らせを送りたいときは、1件ずつ状況を変えてください。
        </p>
      )}
      {confirmDialog}
    </div>
  )
}
