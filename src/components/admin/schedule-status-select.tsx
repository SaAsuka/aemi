"use client"

import { useTransition } from "react"
import { updateScheduleStatus } from "@/lib/actions/schedule"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const statuses = [
  { value: "CONFIRMED", label: "確定" },
  { value: "COMPLETED", label: "完了" },
  { value: "NO_SHOW", label: "無断欠席" },
  { value: "CANCELLED", label: "キャンセル" },
]

export function ScheduleStatusSelect({
  scheduleId,
  currentStatus,
}: {
  scheduleId: string
  currentStatus: string
}) {
  const [isPending, startTransition] = useTransition()

  function handleChange(value: string | null) {
    if (!value) return
    startTransition(async () => {
      await updateScheduleStatus(scheduleId, value)
    })
  }

  return (
    <Select defaultValue={currentStatus} onValueChange={handleChange}>
      <SelectTrigger className={`w-32 ${isPending ? "opacity-50" : ""}`}>
        <SelectValue>{(v) => statuses.find((s) => s.value === v)?.label ?? v}</SelectValue>
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
