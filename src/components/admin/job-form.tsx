"use client"

import { useActionState } from "react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { createJob, updateJob } from "@/lib/actions/job"
import { Button } from "@/components/ui/button"
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
import type { Job } from "@/generated/prisma/client"

type ActionResult = { success?: boolean; error?: Record<string, string[]> } | null

function jobAction(job?: Job) {
  return async (_prev: ActionResult, formData: FormData): Promise<ActionResult> => {
    if (job) {
      return await updateJob(job.id, formData)
    }
    return await createJob(formData)
  }
}

export function JobForm({
  job,
  clients,
}: {
  job?: Job
  clients: { id: string; companyName: string }[]
}) {
  const [state, action, isPending] = useActionState(jobAction(job), null)
  const router = useRouter()

  useEffect(() => {
    if (state?.success && !job) {
      router.push("/admin/jobs")
    }
  }, [state, job, router])

  return (
    <form action={action} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="clientId">クライアント *</Label>
          <Select name="clientId" defaultValue={job?.clientId ?? ""}>
            <SelectTrigger>
              <SelectValue placeholder="選択" />
            </SelectTrigger>
            <SelectContent>
              {clients.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.companyName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {state?.error?.clientId && (
            <p className="text-sm text-destructive">{state.error.clientId[0]}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">ステータス</Label>
          <Select name="status" defaultValue={job?.status ?? "DRAFT"}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DRAFT">下書き</SelectItem>
              <SelectItem value="OPEN">募集中</SelectItem>
              <SelectItem value="CLOSED">募集終了</SelectItem>
              <SelectItem value="CANCELLED">キャンセル</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">案件名 *</Label>
        <Input id="title" name="title" defaultValue={job?.title ?? ""} required />
        {state?.error?.title && (
          <p className="text-sm text-destructive">{state.error.title[0]}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">説明</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={job?.description ?? ""}
          rows={4}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="location">場所</Label>
          <Input id="location" name="location" defaultValue={job?.location ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="fee">報酬 (円)</Label>
          <Input id="fee" name="fee" type="number" defaultValue={job?.fee ?? ""} />
        </div>
      </div>

      <div className="border-t pt-4">
        <p className="text-sm font-medium mb-3">フィルタ条件</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="genderReq">性別</Label>
            <Select name="genderReq" defaultValue={job?.genderReq ?? ""}>
              <SelectTrigger>
                <SelectValue placeholder="指定なし" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MALE">男性</SelectItem>
                <SelectItem value="FEMALE">女性</SelectItem>
                <SelectItem value="OTHER">その他</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ageMin">年齢（下限）</Label>
            <Input
              id="ageMin"
              name="ageMin"
              type="number"
              defaultValue={job?.ageMin ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ageMax">年齢（上限）</Label>
            <Input
              id="ageMax"
              name="ageMax"
              type="number"
              defaultValue={job?.ageMax ?? ""}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mt-4">
          <div className="space-y-2">
            <Label htmlFor="heightMin">身長（下限 cm）</Label>
            <Input
              id="heightMin"
              name="heightMin"
              type="number"
              defaultValue={job?.heightMin ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="heightMax">身長（上限 cm）</Label>
            <Input
              id="heightMax"
              name="heightMax"
              type="number"
              defaultValue={job?.heightMax ?? ""}
            />
          </div>
        </div>
      </div>

      <div className="border-t pt-4">
        <p className="text-sm font-medium mb-3">スケジュール</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="startsAt">開始日</Label>
            <Input
              id="startsAt"
              name="startsAt"
              type="date"
              defaultValue={
                job?.startsAt
                  ? new Date(job.startsAt).toISOString().split("T")[0]
                  : ""
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endsAt">終了日</Label>
            <Input
              id="endsAt"
              name="endsAt"
              type="date"
              defaultValue={
                job?.endsAt
                  ? new Date(job.endsAt).toISOString().split("T")[0]
                  : ""
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="deadline">応募締切</Label>
            <Input
              id="deadline"
              name="deadline"
              type="date"
              defaultValue={
                job?.deadline
                  ? new Date(job.deadline).toISOString().split("T")[0]
                  : ""
              }
            />
          </div>
        </div>
        <div className="mt-4">
          <div className="space-y-2">
            <Label htmlFor="capacity">募集人数</Label>
            <Input
              id="capacity"
              name="capacity"
              type="number"
              defaultValue={job?.capacity ?? ""}
              className="max-w-32"
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="note">備考</Label>
        <Textarea id="note" name="note" defaultValue={job?.note ?? ""} />
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? "保存中..." : job ? "更新" : "作成"}
      </Button>
    </form>
  )
}
