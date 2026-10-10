"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { createApplication, getMyApplicationStatus } from "@/lib/actions/application"
import { flushErrorQueue, reportClientError } from "@/lib/client-error-report"
import { clearDraft, loadDraft, saveDraft, type Draft } from "@/lib/apply-draft"
import type { UploadError } from "@/lib/client-upload"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SUBMISSION_CATEGORY_LABELS } from "@/types"
import type { SubmissionField } from "@/lib/submission-fields"
import { SubmissionFieldInput, emptyFieldState, type FieldInputState } from "@/components/submission-field-input"

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

const SUBMIT_TIMEOUT_MS = 30_000
const TIMED_OUT = Symbol("timed-out")
const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

export function JobApplicationForm({
  jobId,
  talentId,
  talentName,
  requirements,
  hasResume = true,
  dateConflict = null,
  token = null,
  fields = [],
  alreadyApplied = false,
  prefill = {},
}: {
  jobId: string
  talentId: string
  talentName: string
  requirements?: Requirement[]
  hasResume?: boolean
  dateConflict?: string | null
  // 専用リンク（?t=）で開いたときのトークン。受け付け側で本人を確かめるのに使う
  token?: string | null
  // 案件ごとの自由な提出項目（コンポジの項目は含まない）
  fields?: SubmissionField[]
  // もう応募済みの案件か（途中保存を消すため）
  alreadyApplied?: boolean
  // 名前・年齢・身長の項目にプロフィールから入れる値（locked: 年齢を書き換え不可にする）
  prefill?: Record<string, { value: string; locked: boolean }>
}) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState("")
  const [action, setAction] = useState<"FIX_FIELDS" | "RETRY" | "CONTACT" | "RELOAD" | null>(null)
  const [deferredItems, setDeferredItems] = useState<{ label: string; code: string | null }[]>([])
  const topMessageRef = useRef<HTMLDivElement>(null)

  const [answers, setAnswers] = useState<Record<string, FieldInputState>>(() =>
    Object.fromEntries(fields.map((f) => [f.key, emptyFieldState(prefill[f.key]?.value ?? "")]))
  )
  const updateAnswer = useCallback((key: string, update: Partial<FieldInputState>) => {
    setAnswers((prev) => ({ ...prev, [key]: { ...prev[key], ...update } }))
  }, [])

  // 途中保存した入力を戻す（応募済みの案件なら途中保存を消す）
  const [draftLoaded, setDraftLoaded] = useState(false)
  useEffect(() => {
    if (alreadyApplied) {
      clearDraft(talentId, jobId)
    } else {
      const draft = loadDraft(talentId, jobId)
      setAnswers((prev) => {
        const next = { ...prev }
        for (const f of fields) {
          const d = draft[f.key]
          // 生年月日から決まる年齢は途中保存で上書きしない
          if (!d || !next[f.key] || prefill[f.key]?.locked) continue
          next[f.key] = {
            ...next[f.key],
            value: typeof d.value === "string" ? d.value : next[f.key].value,
            fileUrl: d.fileUrl ?? next[f.key].fileUrl,
            fileName: d.fileName ?? next[f.key].fileName,
          }
        }
        return next
      })
    }
    setDraftLoaded(true)
    // 最初の1回だけ
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 入力のたびに途中保存（間引く）
  useEffect(() => {
    if (!draftLoaded || alreadyApplied || fields.length === 0) return
    const timer = setTimeout(() => {
      const draft: Draft = {}
      for (const f of fields) {
        const a = answers[f.key]
        if (a) draft[f.key] = { value: a.value, fileUrl: a.fileUrl, fileName: a.fileName }
      }
      saveDraft(talentId, jobId, draft)
    }, 500)
    return () => clearTimeout(timer)
  }, [answers, draftLoaded, alreadyApplied, fields, talentId, jobId])

  // アップロードの失敗を端末から報告し、受付番号を得る
  const handleUploadError = useCallback(
    async (err: UploadError, fieldKey: string) => {
      if (!err.info.reason) return null
      return reportClientError({ form: "upload", jobId, field: fieldKey, reason: err.info.reason, message: err.info.message, t: token })
    },
    [jobId, token]
  )

  const isAnswered = (f: SubmissionField, a: FieldInputState | undefined) => {
    if (!a) return false
    if (f.kind === "PHOTO" || f.kind === "FILE") return !!a.fileUrl || a.deferred
    return !!a.value.trim()
  }
  const allFieldsAnswered = fields.every((f) => !f.required || isAnswered(f, answers[f.key]))
  const anyFieldUploading = Object.values(answers).some((a) => a.uploading)

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
      const fd = new FormData()
      fd.append("file", file)
      fd.append("category", "applications")
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      if (!res.ok) throw new Error((await res.json()).error ?? "アップロードに失敗しました")
      const { url } = await res.json()
      updateSubmission(cat, { fileUrl: url, fileName: file.name, uploading: false })
    } catch {
      updateSubmission(cat, { uploading: false })
      alert("アップロードに失敗しました")
    }
  }, [updateSubmission])

  const hasRequirements = requirements && requirements.length > 0

  const allRequirementsSubmitted = !hasRequirements || requirements.every((req) => {
    const sub = submissions[req.category]
    if (!sub) return false
    return sub.mode === "file" ? !!sub.fileUrl : !!sub.externalUrl.trim()
  })
  const allSubmitted = allRequirementsSubmitted && allFieldsAnswered

  const anyUploading = Object.values(submissions).some((s) => s.uploading) || anyFieldUploading

  const handleApply = async () => {
    setStatus("loading")
    setAction(null)
    setAnswers((prev) => Object.fromEntries(Object.entries(prev).map(([k, a]) => [k, a.deferred ? a : { ...a, error: null }])))
    const formData = new FormData()
    formData.set("talentId", talentId)
    formData.set("jobId", jobId)
    formData.set("status", "APPLIED")
    if (token) formData.set("t", token)

    for (const [cat, sub] of Object.entries(submissions)) {
      if (sub.mode === "file" && sub.fileUrl) {
        formData.set(`sub_${cat}_fileUrl`, sub.fileUrl)
        if (sub.fileName) formData.set(`sub_${cat}_fileName`, sub.fileName)
      } else if (sub.mode === "url" && sub.externalUrl.trim()) {
        formData.set(`sub_${cat}_externalUrl`, sub.externalUrl.trim())
      }
    }

    // 自由な提出項目。表示していた項目のキーも送る（入力中に案件の項目が変わったかを受け付け側で確かめる）
    formData.set("fieldKeys", JSON.stringify(fields.map((f) => f.key)))
    for (const f of fields) {
      const a = answers[f.key]
      if (!a) continue
      if (f.kind === "PHOTO" || f.kind === "FILE") {
        if (a.fileUrl) {
          formData.set(`ans_${f.key}_fileUrl`, a.fileUrl)
          if (a.fileName) formData.set(`ans_${f.key}_fileName`, a.fileName)
        } else if (a.deferred) {
          formData.set(`ans_${f.key}_deferred`, "1")
          if (a.errorCode) formData.set(`ans_${f.key}_deferred_code`, a.errorCode)
        }
      } else if (a.value.trim()) {
        formData.set(`ans_${f.key}_value`, a.value.trim())
      }
    }

    // 端末にためていた失敗の報告を先に送る（「あとで別途送る」の確認に間に合わせるため。待つのは長くても5秒）
    await Promise.race([flushErrorQueue(token), wait(5_000)])

    // 返事が30秒来なければ待つのをやめ、応募できていたかを確かめる（くるくるが終わらない状態を作らない）
    const result = await Promise.race([
      createApplication(formData),
      wait(SUBMIT_TIMEOUT_MS).then((): typeof TIMED_OUT => TIMED_OUT),
    ])

    if (result === TIMED_OUT) {
      const check = await getMyApplicationStatus(jobId, token).catch(() => null)
      if (check?.applied) {
        finishSuccess(check.deferred)
        return
      }
      const code = reportClientError({ form: "application", jobId, reason: "TIMEOUT", message: "応募の送信が30秒で終わらなかった", t: token })
      setStatus("error")
      setAction("RETRY")
      setMessage(`通信に時間がかかっています。入力はそのまま残っているので、電波の良い場所でもう一度「応募する」を押してください（受付番号：${code}）`)
      return
    }

    if ("error" in result && result.error) {
      setStatus("error")
      const action = "action" in result ? result.action : undefined
      setAction(action ?? null)
      if (action === "RELOAD") {
        setMessage("案件の内容が更新されました。画面を開き直してください（入力は残っています）")
        return
      }

      // 自由項目のエラーはその項目の場所に出し、最初の項目までスクロールする
      const err = result.error as Record<string, string[] | undefined>
      const others: string[] = []
      let firstKey: string | null = null
      for (const [name, msgs] of Object.entries(err)) {
        if (!msgs?.length) continue
        const key = name.startsWith("ans_") ? name.slice(4) : null
        if (key && fields.some((f) => f.key === key)) {
          updateAnswer(key, { error: msgs[0] })
          firstKey ??= key
        } else {
          others.push(...msgs)
        }
      }
      setMessage(
        others.length > 0
          ? others.join(", ")
          : action === "FIX_FIELDS"
            ? "入力内容を確認してください。赤字の項目を直してから、もう一度「応募する」を押してください"
            : "エラーが発生しました。時間をおいてもう一度お試しください"
      )
      requestAnimationFrame(() => {
        const target = firstKey ? document.getElementById(`field-${firstKey}`) : topMessageRef.current
        target?.scrollIntoView({ behavior: "smooth", block: "center" })
      })
    } else {
      finishSuccess("deferred" in result ? result.deferred ?? [] : [])
    }
  }

  const finishSuccess = (deferred: { label: string; code: string | null }[]) => {
    clearDraft(talentId, jobId)
    setDeferredItems(deferred)
    setStatus("success")
    setMessage(`${talentName}さんの応募が完了しました`)
  }

  if (status === "success") {
    return (
      <div className="space-y-3">
        <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center">
          <p className="text-green-800 font-medium">{message}</p>
        </div>
        {deferredItems.length > 0 && (
          <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900" role="status">
            <p className="font-medium">次の項目は、管理者に別途送ってください</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {deferredItems.map((d) => (
                <li key={`${d.label}-${d.code}`}>
                  {d.label}
                  {d.code && <span className="ml-1">（受付番号：{d.code}）</span>}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs">送るときは、受付番号も一緒に伝えてください。</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {status === "error" && (
        <div ref={topMessageRef} className="rounded-lg border border-red-200 bg-red-50 p-4 text-center" role="alert">
          <p className="text-red-800 text-sm">{message}</p>
          {action === "RELOAD" && (
            <button type="button" onClick={() => window.location.reload()} className="mt-2 text-sm text-red-800 underline">
              画面を開き直す
            </button>
          )}
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
                  <p className="text-sm font-medium">{req.category === "PROFILE_PHOTO" ? "現状写真（今のご自身の写真）" : SUBMISSION_CATEGORY_LABELS[req.category]}</p>
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

      {fields.length > 0 && (
        <div className="rounded-lg border p-4 space-y-4">
          <p className="text-sm font-medium">{hasRequirements ? "その他の提出物" : "提出物"}</p>
          {fields.map((f) => (
            <SubmissionFieldInput
              key={f.key}
              field={f}
              state={answers[f.key] ?? emptyFieldState()}
              onChange={(update) => updateAnswer(f.key, update)}
              jobId={jobId}
              token={token}
              onUploadError={(err) => handleUploadError(err, f.key)}
              prefill={prefill[f.key]}
            />
          ))}
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
