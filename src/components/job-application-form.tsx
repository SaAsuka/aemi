"use client"

import { useState, useCallback } from "react"
import { upload } from "@vercel/blob/client"
import { createApplication } from "@/lib/actions/application"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SUBMISSION_CATEGORY_LABELS } from "@/types"

type Requirement = {
  id: string
  category: string
  description: string | null
  referenceUrl: string | null
  referenceFile: string | null
}

type SubmissionData = {
  mode: "file" | "url"
  fileUrl: string | null
  externalUrl: string
  fileName: string | null
  uploading: boolean
}

export function JobApplicationForm({
  jobId,
  talentId,
  talentName,
  requirements,
  hasResume = true,
  dateConflict = null,
}: {
  jobId: string
  talentId: string
  talentName: string
  requirements?: Requirement[]
  hasResume?: boolean
  dateConflict?: string | null
}) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState("")

  const initialSubmissions: Record<string, SubmissionData> = {}
  if (requirements) {
    for (const req of requirements) {
      initialSubmissions[req.category] = {
        mode: "file",
        fileUrl: null,
        externalUrl: "",
        fileName: null,
        uploading: false,
      }
    }
  }
  const [submissions, setSubmissions] = useState(initialSubmissions)

  const updateSubmission = useCallback((cat: string, update: Partial<SubmissionData>) => {
    setSubmissions((prev) => ({
      ...prev,
      [cat]: { ...prev[cat], ...update },
    }))
  }, [])

  const handleFileUpload = useCallback(async (cat: string, file: File) => {
    updateSubmission(cat, { uploading: true })
    try {
      const blob = await upload(file.name, file, {
        access: "private",
        handleUploadUrl: "/api/upload",
      })
      updateSubmission(cat, { fileUrl: blob.url, fileName: file.name, uploading: false })
    } catch {
      updateSubmission(cat, { uploading: false })
      alert("アップロードに失敗しました")
    }
  }, [updateSubmission])

  const hasRequirements = requirements && requirements.length > 0

  const allSubmitted = !hasRequirements || requirements.every((req) => {
    const sub = submissions[req.category]
    if (!sub) return false
    return sub.mode === "file" ? !!sub.fileUrl : !!sub.externalUrl.trim()
  })

  const anyUploading = Object.values(submissions).some((s) => s.uploading)

  const handleApply = async () => {
    setStatus("loading")
    const formData = new FormData()
    formData.set("talentId", talentId)
    formData.set("jobId", jobId)
    formData.set("status", "APPLIED")

    for (const [cat, sub] of Object.entries(submissions)) {
      if (sub.mode === "file" && sub.fileUrl) {
        formData.set(`sub_${cat}_fileUrl`, sub.fileUrl)
        if (sub.fileName) formData.set(`sub_${cat}_fileName`, sub.fileName)
      } else if (sub.mode === "url" && sub.externalUrl.trim()) {
        formData.set(`sub_${cat}_externalUrl`, sub.externalUrl.trim())
      }
    }

    const result = await createApplication(formData)

    if ("error" in result && result.error) {
      setStatus("error")
      const err = result.error
      if (typeof err === "string") {
        setMessage(err)
      } else {
        const values: string[] = []
        for (const v of Object.values(err)) {
          if (v) values.push(...v)
        }
        setMessage(values.join(", ") || "エラーが発生しました")
      }
    } else {
      setStatus("success")
      setMessage(`${talentName}さんの応募が完了しました`)
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center">
        <p className="text-green-800 font-medium">{message}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {status === "error" && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center">
          <p className="text-red-800 text-sm">{message}</p>
        </div>
      )}

      {hasRequirements && (
        <div className="rounded-lg border p-4 space-y-4">
          <p className="text-sm font-medium">提出物</p>
          {requirements.map((req) => {
            const sub = submissions[req.category]
            if (!sub) return null
            return (
              <div key={req.category} className="space-y-2 border-t pt-3 first:border-t-0 first:pt-0">
                <div>
                  <p className="text-sm font-medium">{SUBMISSION_CATEGORY_LABELS[req.category]}</p>
                  {req.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">{req.description}</p>
                  )}
                  {(req.referenceUrl || req.referenceFile) && (
                    <div className="flex gap-2 mt-1">
                      {req.referenceUrl && (
                        <a
                          href={req.referenceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline"
                        >
                          参考資料URL
                        </a>
                      )}
                      {req.referenceFile && (
                        <a
                          href={req.referenceFile}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline"
                        >
                          参考ファイル
                        </a>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex gap-3 text-sm">
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name={`mode_${req.category}`}
                      checked={sub.mode === "file"}
                      onChange={() => updateSubmission(req.category, { mode: "file" })}
                      className="accent-primary"
                    />
                    ファイル
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name={`mode_${req.category}`}
                      checked={sub.mode === "url"}
                      onChange={() => updateSubmission(req.category, { mode: "url" })}
                      className="accent-primary"
                    />
                    URL
                  </label>
                </div>

                {sub.mode === "file" ? (
                  <div className="space-y-1">
                    {sub.fileUrl ? (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-green-700">{sub.fileName ?? "アップロード済み"}</span>
                        <button
                          type="button"
                          onClick={() => updateSubmission(req.category, { fileUrl: null, fileName: null })}
                          className="text-xs text-red-600 hover:underline"
                        >
                          削除
                        </button>
                      </div>
                    ) : (
                      <Input
                        type="file"
                        accept="video/*,audio/*,image/*,.pdf"
                        disabled={sub.uploading}
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleFileUpload(req.category, file)
                        }}
                        className="text-sm"
                      />
                    )}
                    {sub.uploading && <p className="text-xs text-muted-foreground">アップロード中...</p>}
                  </div>
                ) : (
                  <div>
                    <Label className="text-xs">URL</Label>
                    <Input
                      value={sub.externalUrl}
                      onChange={(e) => updateSubmission(req.category, { externalUrl: e.target.value })}
                      placeholder="https://youtube.com/..."
                      className="text-sm"
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {dateConflict && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-800">
          ⚠ {dateConflict}
        </div>
      )}

      {!hasResume && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
          コンポジPDFが未登録のため応募できません。先に設定画面から宣材写真をアップロードし、コンポジPDFを生成してください。
        </div>
      )}

      <div className="h-20" />

      <div className="fixed bottom-0 inset-x-0 z-30 border-t bg-background p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto max-w-4xl">
          <Button
            onClick={handleApply}
            disabled={status === "loading" || !allSubmitted || anyUploading || !hasResume || !!dateConflict}
            className="w-full"
            size="lg"
          >
            {status === "loading" ? "送信中..." : dateConflict ? "日程が重複しています" : !hasResume ? "コンポジPDF未登録" : anyUploading ? "アップロード中..." : !allSubmitted ? "提出物を入力してください" : "この案件に応募する"}
          </Button>
        </div>
      </div>
    </div>
  )
}
