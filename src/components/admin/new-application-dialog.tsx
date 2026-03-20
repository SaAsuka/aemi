"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { createApplication } from "@/lib/actions/application"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function NewApplicationDialog({
  talents,
  jobs,
}: {
  talents: { id: string; name: string; nameKana: string }[]
  jobs: { id: string; title: string }[]
}) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await createApplication(formData)
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
      <DialogTrigger render={<Button />}>新規応募</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>新規応募登録</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>タレント *</Label>
            <Select name="talentId">
              <SelectTrigger>
                <SelectValue placeholder="タレントを選択" />
              </SelectTrigger>
              <SelectContent>
                {talents.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}（{t.nameKana}）
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>案件 *</Label>
            <Select name="jobId">
              <SelectTrigger>
                <SelectValue placeholder="案件を選択" />
              </SelectTrigger>
              <SelectContent>
                {jobs.map((j) => (
                  <SelectItem key={j.id} value={j.id}>
                    {j.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
