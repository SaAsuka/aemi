"use client"

import { useActionState } from "react"
import { useRouter } from "next/navigation"
import { useEffect, useState, useCallback } from "react"
import { upload } from "@vercel/blob/client"
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
import { SUBMISSION_CATEGORY_LABELS } from "@/types"

type ActionResult = { success?: boolean; error?: Record<string, string[]> } | null

type Requirement = {
  id: string
  category: string
  description: string | null
  referenceUrl: string | null
  referenceFile: string | null
}

function jobAction(job?: Job) {
  return async (_prev: ActionResult, formData: FormData): Promise<ActionResult> => {
    if (job) {
      return await updateJob(job.id, formData)
    }
    return await createJob(formData)
  }
}

const CATEGORIES = ["ACTING_VIDEO", "VOICE_SAMPLE", "PAST_WORK_VIDEO", "PROFILE_PHOTO"] as const

export function JobForm({
  job,
  clients,
  requirements,
}: {
  job?: Job
  clients: { id: string; companyName: string }[]
  requirements?: Requirement[]
}) {
  const [state, action, isPending] = useActionState(jobAction(job), null)
  const router = useRouter()

  const reqMap = new Map(requirements?.map((r) => [r.category, r]))
  const [enabledCategories, setEnabledCategories] = useState<Set<string>>(
    new Set(requirements?.map((r) => r.category) ?? [])
  )
  const [refFiles, setRefFiles] = useState<Record<string, string>>(
    Object.fromEntries(requirements?.filter((r) => r.referenceFile).map((r) => [r.category, r.referenceFile!]) ?? [])
  )
  const [uploading, setUploading] = useState<string | null>(null)

  const toggleCategory = useCallback((cat: string) => {
    setEnabledCategories((prev) => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
  }, [])

  const handleRefFileUpload = useCallback(async (cat: string, file: File) => {
    setUploading(cat)
    try {
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/upload",
      })
      setRefFiles((prev) => ({ ...prev, [cat]: blob.url }))
    } catch {
      alert("アップロードに失敗しました")
    } finally {
      setUploading(null)
    }
  }, [])

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

      <div className="border-t pt-4">
        <p className="text-sm font-medium mb-3">提出要件</p>
        <p className="text-xs text-muted-foreground mb-4">タレントに提出を求めるものを選択してください</p>
        <div className="space-y-3">
          {CATEGORIES.map((cat) => {
            const enabled = enabledCategories.has(cat)
            const existing = reqMap.get(cat)
            return (
              <div key={cat} className="rounded-lg border p-3 space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name={`req_${cat}_enabled`}
                    checked={enabled}
                    onChange={() => toggleCategory(cat)}
                    className="h-4 w-4 rounded border-gray-300 accent-primary"
                  />
                  <span className="text-sm font-medium">{SUBMISSION_CATEGORY_LABELS[cat]}</span>
                </label>
                {enabled && (
                  <div className="pl-6 space-y-3">
                    <div className="space-y-1">
                      <Label className="text-xs">補足説明</Label>
                      <Input
                        name={`req_${cat}_description`}
                        defaultValue={existing?.description ?? ""}
                        placeholder="例: 30秒以内の自己PR動画"
                        className="text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">参考資料URL</Label>
                      <Input
                        name={`req_${cat}_referenceUrl`}
                        defaultValue={existing?.referenceUrl ?? ""}
                        placeholder="https://..."
                        className="text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">参考ファイル</Label>
                      <input type="hidden" name={`req_${cat}_referenceFile`} value={refFiles[cat] ?? ""} />
                      {refFiles[cat] ? (
                        <div className="flex items-center gap-2 text-sm">
                          <a href={refFiles[cat]} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate max-w-64">
                            {refFiles[cat].split("/").pop()}
                          </a>
                          <button
                            type="button"
                            onClick={() => setRefFiles((prev) => {
                              const next = { ...prev }
                              delete next[cat]
                              return next
                            })}
                            className="text-xs text-red-600 hover:underline"
                          >
                            削除
                          </button>
                        </div>
                      ) : (
                        <Input
                          type="file"
                          accept=".pdf,.mp4,.mov,.webm,.jpg,.jpeg,.png,.webp"
                          disabled={uploading === cat}
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleRefFileUpload(cat, file)
                          }}
                          className="text-sm"
                        />
                      )}
                      {uploading === cat && <p className="text-xs text-muted-foreground">アップロード中...</p>}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
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
