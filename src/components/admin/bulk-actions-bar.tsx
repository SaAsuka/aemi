"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { bulkUpdateApplicationStatus, bulkDeleteApplications } from "@/lib/actions/application"
import { X } from "lucide-react"

const STATUS_OPTIONS = [
  { value: "APPLIED", label: "応募済み" },
  { value: "RESUME_SENT", label: "書類送付済" },
  { value: "ACCEPTED", label: "合格" },
  { value: "REJECTED", label: "不合格" },
  { value: "CANCELLED", label: "キャンセル" },
]

export function BulkActionsBar({
  selectedIds,
  onClear,
}: {
  selectedIds: string[]
  onClear: () => void
}) {
  const [isPending, startTransition] = useTransition()
  const [bulkStatus, setBulkStatus] = useState("")

  if (selectedIds.length === 0) return null

  function handleBulkStatusChange() {
    if (!bulkStatus) return
    startTransition(async () => {
      await bulkUpdateApplicationStatus(selectedIds, bulkStatus)
      onClear()
      setBulkStatus("")
    })
  }

  function handleBulkDelete() {
    if (!confirm(`${selectedIds.length}件の応募を削除しますか？`)) return
    startTransition(async () => {
      await bulkDeleteApplications(selectedIds)
      onClear()
    })
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-3">
      <span className="text-sm font-medium">{selectedIds.length}件選択中</span>
      <div className="flex items-center gap-2">
        <Select value={bulkStatus} onValueChange={(v) => setBulkStatus(v ?? "")}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="ステータス変更" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          size="sm"
          onClick={handleBulkStatusChange}
          disabled={!bulkStatus || isPending}
        >
          {isPending ? "処理中..." : "一括変更"}
        </Button>
      </div>
      <Button
        variant="destructive"
        size="sm"
        onClick={handleBulkDelete}
        disabled={isPending}
      >
        一括削除
      </Button>
      <Button variant="ghost" size="icon-sm" onClick={onClear}>
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}
