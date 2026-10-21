"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { createApplication, getMyApplicationStatus } from "@/lib/actions/application"
import { flushErrorQueue, reportClientError } from "@/lib/client-error-report"
import { clearDraft, loadDraft, saveDraft, type Draft } from "@/lib/apply-draft"
import type { UploadError } from "@/lib/client-upload"
import { AlertCircle, AlertTriangle, CheckCircle2, ExternalLink, FileCheck2, Info, Loader2 } from "lucide-react"
import { BTN_PRIMARY, FIELD, FILE_FIELD, PANEL, TEXTAREA } from "@/components/talent/styles"
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
const REMARKS_MAX = 1000
// 途中保存で備考を入れておくキー（自由項目のキーは k_ / v_ で始まるので重ならない）
const REMARKS_DRAFT_KEY = "__remarks"
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

  // タレントからの備考（撮影日の都合など）
  const [remarks, setRemarks] = useState("")
  const [remarksError, setRemarksError] = useState<string | null>(null)

  // 途中保存した入力を戻す（応募済みの案件なら途中保存を消す）
  const [draftLoaded, setDraftLoaded] = useState(false)
  useEffect(() => {
    if (alreadyApplied) {
      clearDraft(talentId, jobId)
    } else {
      const draft = loadDraft(talentId, jobId)
      if (typeof draft[REMARKS_DRAFT_KEY]?.value === "string") setRemarks(draft[REMARKS_DRAFT_KEY].value!)
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
    if (!draftLoaded || alreadyApplied) return
    const timer = setTimeout(() => {
      const draft: Draft = { [REMARKS_DRAFT_KEY]: { value: remarks } }
      for (const f of fields) {
        const a = answers[f.key]
        if (a) draft[f.key] = { value: a.value, fileUrl: a.fileUrl, fileName: a.fileName }
      }
      saveDraft(talentId, jobId, draft)
    }, 500)
    return () => clearTimeout(timer)
  }, [answers, remarks, draftLoaded, alreadyApplied, fields, talentId, jobId])

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
    setRemarksError(null)
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
    if (remarks.trim()) formData.set("talentRemarks", remarks.trim())

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
        if (name === "talentRemarks") {
          setRemarksError(msgs[0])
          firstKey ??= "remarks"
          continue
        }
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
        <div className={`${PANEL} flex flex-col items-center px-5 py-8 text-center`} role="status">
          <CheckCircle2 className="size-10 text-green-700" aria-hidden="true" />
          <p className="mt-3 text-base font-semibold text-neutral-950">{message}</p>
        </div>
        {deferredItems.length > 0 && (
          <div className="rounded-xl border border-amber-300 bg-amber-50 p-5 text-sm text-amber-900" role="status">
            <p className="flex items-start gap-2 font-medium">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              次の項目は、管理者に別途送ってください
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-11">
              {deferredItems.map((d) => (
                <li key={`${d.label}-${d.code}`}>
                  {d.label}
                  {d.code && <span className="ml-1">（受付番号：{d.code}）</span>}
                </li>
              ))}
            </ul>
            <p className="mt-2 pl-6 text-xs">送るときは、受付番号も一緒に伝えてください。</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {status === "error" && (
        <div ref={topMessageRef} className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          <p className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>{message}</span>
          </p>
          {action === "RELOAD" && (
            <button type="button" onClick={() => window.location.reload()} className="mt-2 ml-6 font-medium underline underline-offset-4">
              画面を開き直す
            </button>
          )}
        </div>
      )}

      {hasRequirements && (
        <section className={`${PANEL} p-5 sm:p-6`}>
          <h3 className="text-base font-semibold text-neutral-950">提出物</h3>
          <div className="mt-4 divide-y divide-neutral-100">
          {requirements.map((req) => {
            const sub = submissions[req.category]
            if (!sub) return null
            return (
              <div key={req.category} className="space-y-3 py-4 first:pt-0 last:pb-0">
                <div>
                  <p className="flex items-center gap-1.5 text-sm font-medium text-neutral-900">
                    {req.category === "PROFILE_PHOTO" ? "現状写真（今のご自身の写真）" : SUBMISSION_CATEGORY_LABELS[req.category]}
                    <span className="rounded bg-neutral-950 px-1.5 py-px text-[10px] font-semibold leading-4 text-white">必須</span>
                  </p>
                  {req.description && (
                    <p className="mt-1 text-xs leading-relaxed text-neutral-500">{req.description}</p>
                  )}
                  {(req.referenceUrl || req.referenceFile) && (
                    <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
                      {req.referenceUrl && (
                        <a
                          href={req.referenceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 underline-offset-4 hover:underline"
                        >
                          参考資料URL
                          <ExternalLink className="size-3" aria-hidden="true" />
                        </a>
                      )}
                      {req.referenceFile && (
                        <a
                          href={req.referenceFile}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 underline-offset-4 hover:underline"
                        >
                          参考ファイル
                          <ExternalLink className="size-3" aria-hidden="true" />
                        </a>
                      )}
                    </div>
                  )}
                </div>

                {/* ファイルかURLかを選ぶ（見た目は切り替えボタン、中身はラジオボタン） */}
                <div className="inline-flex rounded-lg bg-neutral-100 p-1 text-sm">
                  {(["file", "url"] as const).map((m) => (
                    <label
                      key={m}
                      className={`flex h-8 cursor-pointer items-center rounded-md px-3 transition-colors focus-within:ring-2 focus-within:ring-neutral-950/30 ${
                        sub.mode === m ? "bg-white font-medium text-neutral-950 shadow-sm" : "text-neutral-500 hover:text-neutral-950"
                      }`}
                    >
                      <input
                        type="radio"
                        name={`mode_${req.category}`}
                        checked={sub.mode === m}
                        onChange={() => updateSubmission(req.category, { mode: m })}
                        className="sr-only"
                      />
                      {m === "file" ? "ファイル" : "URL"}
                    </label>
                  ))}
                </div>

                {sub.mode === "file" ? (
                  <div className="space-y-1.5">
                    {sub.fileUrl ? (
                      <div className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm">
                        <FileCheck2 className="size-4 shrink-0 text-green-700" aria-hidden="true" />
                        <span className="min-w-0 flex-1 truncate text-neutral-900">{sub.fileName ?? "アップロード済み"}</span>
                        <button
                          type="button"
                          onClick={() => updateSubmission(req.category, { fileUrl: null, fileName: null })}
                          className="shrink-0 rounded px-1.5 py-0.5 text-xs font-medium text-red-600 hover:bg-red-50"
                        >
                          削除
                        </button>
                      </div>
                    ) : (
                      <input
                        type="file"
                        accept="video/*,audio/*,image/*,.pdf"
                        disabled={sub.uploading}
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleFileUpload(req.category, file)
                        }}
                        aria-label={`${req.category === "PROFILE_PHOTO" ? "現状写真" : SUBMISSION_CATEGORY_LABELS[req.category]}のファイル`}
                        className={FILE_FIELD}
                      />
                    )}
                    {sub.uploading && (
                      <p className="flex items-center gap-1.5 text-xs text-neutral-500" role="status">
                        <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                        アップロード中...
                      </p>
                    )}
                  </div>
                ) : (
                  <div>
                    <label htmlFor={`url_${req.category}`} className="mb-1.5 block text-xs font-medium text-neutral-700">URL</label>
                    <input
                      id={`url_${req.category}`}
                      value={sub.externalUrl}
                      onChange={(e) => updateSubmission(req.category, { externalUrl: e.target.value })}
                      placeholder="https://youtube.com/..."
                      inputMode="url"
                      autoCapitalize="none"
                      spellCheck={false}
                      className={FIELD}
                    />
                  </div>
                )}
              </div>
            )
          })}
          </div>
        </section>
      )}

      {fields.length > 0 && (
        <section className={`${PANEL} p-5 sm:p-6`}>
          <h3 className="text-base font-semibold text-neutral-950">{hasRequirements ? "その他の提出物" : "提出物"}</h3>
          <div className="mt-4 divide-y divide-neutral-100">
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
        </section>
      )}

      <section id="field-remarks" className={`${PANEL} p-5 sm:p-6`}>
        <label htmlFor="talent-remarks" className="flex items-center gap-1.5 text-base font-semibold text-neutral-950">
          備考<span className="text-xs font-normal text-neutral-500">任意</span>
        </label>
        <p className="mt-1 text-sm text-neutral-500">撮影日のご都合など、伝えたいことがあれば書いてください</p>
        <textarea
          id="talent-remarks"
          value={remarks}
          onChange={(e) => {
            setRemarks(e.target.value)
            setRemarksError(null)
          }}
          rows={3}
          maxLength={REMARKS_MAX}
          aria-invalid={!!remarksError || undefined}
          className={`${TEXTAREA} mt-3`}
        />
        <p className="mt-1.5 text-right text-xs tabular-nums text-neutral-400">
          {remarks.length}/{REMARKS_MAX}
        </p>
        {remarksError && (
          <p className="flex items-start gap-1 text-xs text-red-600" role="alert">
            <AlertCircle className="mt-px size-3.5 shrink-0" aria-hidden="true" />
            {remarksError}
          </p>
        )}
      </section>

      {dateConflict && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{dateConflict}</span>
        </div>
      )}

      {!hasResume && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>コンポジPDFが未登録のため応募できません。先に設定画面から宣材写真をアップロードし、コンポジPDFを生成してください。</span>
        </div>
      )}

      <div className="h-20" />

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-neutral-200 bg-white p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto max-w-3xl">
          <button
            type="button"
            onClick={handleApply}
            disabled={status === "loading" || !allSubmitted || anyUploading || !hasResume || !!dateConflict}
            className={`${BTN_PRIMARY} w-full disabled:bg-neutral-300 disabled:opacity-100 disabled:text-neutral-600`}
          >
            {status === "loading" && <Loader2 className="animate-spin" aria-hidden="true" />}
            {status === "loading" ? "送信中..." : dateConflict ? "日程が重複しています" : !hasResume ? "コンポジPDF未登録" : anyUploading ? "アップロード中..." : !allSubmitted ? "提出物を入力してください" : "この案件に応募する"}
          </button>
        </div>
      </div>
    </div>
  )
}
