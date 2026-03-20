"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { createSchedule } from "@/lib/actions/schedule"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type AcceptedApp = {
  id: string
  talent: { name: string }
  job: { title: string }
}

export function NewScheduleDialog({
  applications,
}: {
  applications: AcceptedApp[]
}) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await createSchedule(formData)
      if (result.error) {
        const firstError = Object.values(result.error)[0]
        setError(Array.isArray(firstError) ? firstError[0] : String(firstError))
        return
      }
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button disabled={applications.length === 0} />}
      >
        スケジュール登録
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>スケジュール登録</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>合格済み応募 *</Label>
            <Select name="applicationId">
              <SelectTrigger>
                <SelectValue placeholder="応募を選択" />
              </SelectTrigger>
              <SelectContent>
                {applications.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.talent.name} − {a.job.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-3 gap-4">
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

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? "登録中..." : "登録"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
