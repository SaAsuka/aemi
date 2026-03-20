"use client"

import { useTransition } from "react"
import { updateApplicationStatus } from "@/lib/actions/application"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const statuses = [
  { value: "APPLIED", label: "応募済み" },
  { value: "RESUME_SENT", label: "書類送付済" },
  { value: "ACCEPTED", label: "合格" },
  { value: "REJECTED", label: "不合格" },
  { value: "CANCELLED", label: "キャンセル" },
]

export function ApplicationStatusSelect({
  applicationId,
  currentStatus,
}: {
  applicationId: string
  currentStatus: string
}) {
  const [isPending, startTransition] = useTransition()

  function handleChange(value: string | null) {
    if (!value) return
    startTransition(async () => {
      await updateApplicationStatus(applicationId, value)
    })
  }

  if (currentStatus === "AUTO_REJECTED") {
    return <span className="text-sm text-muted-foreground">自動不合格</span>
  }

  return (
    <Select defaultValue={currentStatus} onValueChange={handleChange}>
      <SelectTrigger className={`w-36 ${isPending ? "opacity-50" : ""}`}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {statuses.map((s) => (
          <SelectItem key={s.value} value={s.value}>
            {s.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
