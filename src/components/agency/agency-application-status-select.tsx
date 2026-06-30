"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { updateAgencyApplicationStatus } from "@/lib/actions/agency-application"
import { createAgencySchedule } from "@/lib/actions/agency-schedule"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

const statuses = [
  { value: "APPLIED", label: "応募済み", className: "bg-gray-100 text-gray-700 border-gray-200" },
  { value: "RESUME_SENT", label: "書類送付済", className: "bg-blue-100 text-blue-700 border-blue-200" },
  { value: "ACCEPTED", label: "合格", className: "bg-green-100 text-green-700 border-green-200" },
  { value: "REJECTED", label: "不合格", className: "bg-red-100 text-red-700 border-red-200" },
  { value: "CANCELLED", label: "キャンセル", className: "bg-gray-50 text-gray-400 border-gray-100" },
]

export function AgencyApplicationStatusSelect({
  applicationId,
  currentStatus,
  talentName,
  jobTitle,
}: {
  applicationId: string
  currentStatus: string
  talentName: string
  jobTitle: string
}) {
  const [isPending, startTransition] = useTransition()
  const [showScheduleDialog, setShowScheduleDialog] = useState(false)
  const [scheduleError, setScheduleError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  function handleChange(value: string | null) {
    if (!value) return
    startTransition(async () => {
      await updateAgencyApplicationStatus(applicationId, value)
      if (value === "ACCEPTED") {
        setShowScheduleDialog(true)
      }
    })
  }

  async function handleScheduleSubmit(formData: FormData) {
    setScheduleError(null)
    setIsSubmitting(true)
    formData.set("applicationId", applicationId)
    formData.set("status", "CONFIRMED")
    const result = await createAgencySchedule(formData)
    setIsSubmitting(false)
    if (result.error) {
      const firstError = Object.values(result.error)[0]
      setScheduleError(Array.isArray(firstError) ? firstError[0] : String(firstError))
      return
    }
    setShowScheduleDialog(false)
    router.refresh()
  }

  const currentConfig = statuses.find((s) => s.value === currentStatus)

  if (currentStatus === "AUTO_REJECTED") {
    return <span className="inline-block rounded px-1.5 py-0.5 text-xs bg-orange-100 text-orange-700 border border-orange-200">自動不合格</span>
  }

  return (
    <>
      <Select defaultValue={currentStatus} onValueChange={handleChange}>
        <SelectTrigger className={`w-full h-7 text-xs border ${isPending ? "opacity-50" : ""} ${currentConfig?.className ?? ""}`}>
          <SelectValue>{(v) => statuses.find((s) => s.value === v)?.label ?? v}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {statuses.map((s) => (
            <SelectItem key={s.value} value={s.value}>
              <span className={`inline-block rounded px-1.5 py-0.5 text-xs ${s.className}`}>{s.label}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>スケジュール登録</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {talentName} / {jobTitle}
          </p>
          <form action={handleScheduleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>日付 *</Label>
                <Input name="date" type="date" required />
              </div>
              <div className="space-y-2">
                <Label>開始時刻</Label>
                <Input name="startTime" type="time" />
              </div>
              <div className="space-y-2">
                <Label>終了時刻</Label>
                <Input name="endTime" type="time" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>場所</Label>
              <Input name="location" />
            </div>
            <div className="space-y-2">
              <Label>備考</Label>
              <Textarea name="note" />
            </div>
            {scheduleError && <p className="text-sm text-destructive">{scheduleError}</p>}
            <div className="flex gap-2">
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? "登録中..." : "登録"}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setShowScheduleDialog(false)}>
                スキップ
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
