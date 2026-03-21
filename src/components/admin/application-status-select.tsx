"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { updateApplicationStatus } from "@/lib/actions/application"
import { createSchedule } from "@/lib/actions/schedule"
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
  { value: "APPLIED", label: "応募済み" },
  { value: "RESUME_SENT", label: "書類送付済" },
  { value: "ACCEPTED", label: "合格" },
  { value: "REJECTED", label: "不合格" },
  { value: "CANCELLED", label: "キャンセル" },
]

export function ApplicationStatusSelect({
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
      await updateApplicationStatus(applicationId, value)
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
    const result = await createSchedule(formData)
    setIsSubmitting(false)
    if (result.error) {
      const firstError = Object.values(result.error)[0]
      setScheduleError(Array.isArray(firstError) ? firstError[0] : String(firstError))
      return
    }
    setShowScheduleDialog(false)
    router.refresh()
  }

  if (currentStatus === "AUTO_REJECTED") {
    return <span className="text-sm text-muted-foreground">自動不合格</span>
  }

  return (
    <>
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
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowScheduleDialog(false)}
              >
                スキップ
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
