"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { updateScheduleStatus } from "@/lib/actions/schedule"

const statuses = [
  { value: "CONFIRMED", label: "確定", active: "bg-neutral-950 text-white" },
  { value: "COMPLETED", label: "完了", active: "bg-green-700 text-white" },
  { value: "NO_SHOW", label: "無断欠席", active: "bg-red-600 text-white" },
  { value: "CANCELLED", label: "キャンセル", active: "bg-neutral-500 text-white" },
]

// 予定の状況を4つのボタンから選んで変える（押した時点で保存される）
export function ScheduleStatusSelect({
  scheduleId,
  currentStatus,
}: {
  scheduleId: string
  currentStatus: string
}) {
  const [isPending, startTransition] = useTransition()
  const [value, setValue] = useState(currentStatus)

  function handleChange(next: string) {
    if (next === value || isPending) return
    const prev = value
    setValue(next)
    startTransition(async () => {
      const res = await updateScheduleStatus(scheduleId, next)
      if (res && "error" in res && res.error) {
        setValue(prev)
        toast.error("変更できませんでした", { description: String(res.error) })
        return
      }
      toast.success(`「${statuses.find((s) => s.value === next)?.label}」にしました`)
    })
  }

  return (
    <div className="flex items-center gap-2">
      <div role="radiogroup" aria-label="予定の状況" className="grid flex-1 grid-cols-4 gap-1 rounded-lg border border-neutral-300 p-0.5">
        {statuses.map((s) => {
          const active = value === s.value
          return (
            <button
              key={s.value}
              type="button"
              role="radio"
              aria-checked={active}
              disabled={isPending}
              onClick={() => handleChange(s.value)}
              className={`h-8 rounded-md text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950/30 ${
                active ? s.active : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950"
              }`}
            >
              {s.label}
            </button>
          )
        })}
      </div>
      {isPending && <Loader2 className="size-4 animate-spin text-neutral-400" aria-label="保存中" />}
    </div>
  )
}
