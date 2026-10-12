"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ExternalLink, FileText, Loader2 } from "lucide-react"
import { blobProxyUrl } from "@/lib/utils/blob"
import type { AnswerRow } from "@/lib/submission-fields"
import { updateApplicationAnswer } from "@/lib/actions/application-detail"
import { uploadSubmissionFile, UploadError } from "@/lib/client-upload"
import { BTN_PRIMARY, BTN_SECONDARY, FIELD } from "@/components/admin/styles"

type Target = { applicationId: string; jobId: string; talentId: string }

// 管理者が回答を登録・差し替え・修正する欄（別途送ってもらった写真を入れる等）
function AnswerEditor({ row, target, onDone }: { row: AnswerRow; target: Target; onDone: () => void }) {
  const router = useRouter()
  const isFile = row.kind === "PHOTO" || row.kind === "FILE"
  const [value, setValue] = useState(row.answer?.value ?? "")
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const save = async (input: { value?: string; fileUrl?: string; fileName?: string }) => {
    const result = await updateApplicationAnswer(target.applicationId, row.key, input)
    if ("error" in result) {
      setError(result.error)
      return
    }
    toast.success(`「${row.label}」を登録しました`)
    onDone()
    router.refresh()
  }

  const handleFile = async (file: File) => {
    setBusy(true)
    setError(null)
    try {
      const uploaded = await uploadSubmissionFile({
        jobId: target.jobId,
        fieldKey: row.key,
        kind: row.kind === "PHOTO" ? "PHOTO" : "FILE",
        file,
        talentId: target.talentId,
        onProgress: setProgress,
      })
      await save({ fileUrl: uploaded.fileUrl, fileName: uploaded.fileName })
    } catch (e) {
      setError(e instanceof UploadError ? e.info.message : "アップロードできませんでした")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mt-2 space-y-2 rounded-lg border border-neutral-200 bg-neutral-50 p-3">
      {isFile ? (
        <label className={`${BTN_SECONDARY} cursor-pointer ${busy ? "pointer-events-none opacity-60" : ""}`}>
          {busy ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
          {busy ? `アップロード中…${progress}%` : "ファイルを選んで登録"}
          <input
            type="file"
            accept={row.kind === "PHOTO" ? "image/*" : "video/*,audio/*,image/*,.pdf"}
            className="sr-only"
            disabled={busy}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFile(file)
              e.target.value = ""
            }}
          />
        </label>
      ) : (
        <div className="flex flex-col gap-2 sm:flex-row">
          {row.kind === "TEXT" ? (
            <textarea value={value} onChange={(e) => setValue(e.target.value)} rows={2} maxLength={2000} className={`${FIELD} h-auto py-2`} />
          ) : (
            <input value={value} onChange={(e) => setValue(e.target.value)} inputMode="url" placeholder="https://" className={FIELD} />
          )}
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              setBusy(true)
              setError(null)
              await save({ value })
              setBusy(false)
            }}
            className={BTN_PRIMARY}
          >
            保存
          </button>
        </div>
      )}
      {error && (
        <p className="text-xs text-red-700" role="alert">
          {error}
        </p>
      )}
      <button type="button" onClick={onDone} className="text-xs text-neutral-600 underline">
        やめる
      </button>
    </div>
  )
}

const KIND_LABELS: Record<string, string> = { PHOTO: "写真", FILE: "ファイル", TEXT: "文字", URL: "リンク" }

function formatDateTime(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
}

function AnswerValue({ row, resumeUrl }: { row: AnswerRow; resumeUrl: string | null }) {
  if (row.state === "COMPOSITE") {
    return resumeUrl ? (
      <a
        href={blobProxyUrl(resumeUrl, true)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-sm text-neutral-950 underline underline-offset-4 hover:text-neutral-600"
      >
        <FileText className="size-4" aria-hidden="true" />
        コンポジット（登録済みのもの）
      </a>
    ) : (
      <span className="text-sm text-neutral-500">コンポジット未登録</span>
    )
  }

  if (row.state === "MISSING") {
    return <span className="text-sm text-neutral-400">未提出</span>
  }

  if (row.state === "DEFERRED") {
    return (
      <span className="inline-flex flex-wrap items-center gap-1.5 rounded-md bg-amber-50 px-2 py-1 text-sm font-medium text-amber-800 ring-1 ring-amber-200">
        別途送付待ち
        {row.answer?.errorCode && <span className="font-normal">（受付番号：{row.answer.errorCode}）</span>}
      </span>
    )
  }

  const a = row.answer!
  if (a.kind === "PHOTO" && a.fileUrl) {
    return (
      <a href={blobProxyUrl(a.fileUrl)} target="_blank" rel="noopener noreferrer" className="inline-block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={blobProxyUrl(a.fileUrl)}
          alt={row.label}
          className="h-32 w-auto max-w-full rounded-md border border-neutral-200 object-contain"
          loading="lazy"
        />
      </a>
    )
  }
  if (a.kind === "FILE" && a.fileUrl) {
    return (
      <a
        href={blobProxyUrl(a.fileUrl)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-sm text-neutral-950 underline underline-offset-4 hover:text-neutral-600"
      >
        <FileText className="size-4" aria-hidden="true" />
        {a.fileName ?? "ファイルを開く"}
      </a>
    )
  }
  if (a.kind === "URL" && a.value) {
    return (
      <a
        href={a.value}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 break-all text-sm text-neutral-950 underline underline-offset-4 hover:text-neutral-600"
      >
        {a.value}
        <ExternalLink className="size-3.5 shrink-0" aria-hidden="true" />
      </a>
    )
  }
  return <p className="whitespace-pre-wrap break-words text-sm text-neutral-950">{a.value}</p>
}

export function ApplicationAnswers({
  rows,
  resumeUrl,
  target,
}: {
  rows: AnswerRow[]
  resumeUrl: string | null
  target: Target
}) {
  const [editing, setEditing] = useState<string | null>(null)

  if (rows.length === 0) {
    return <p className="rounded-lg bg-neutral-50 px-4 py-6 text-center text-sm text-neutral-500">この案件には提出項目がありません。</p>
  }

  return (
    <ul className="-mx-5 divide-y divide-neutral-100 border-t border-neutral-100 sm:-mx-6">
      {rows.map((row) => (
        <li key={row.key} className="grid gap-2 px-5 py-3.5 sm:grid-cols-[200px_minmax(0,1fr)] sm:px-6">
          <div className="min-w-0">
            <p className="text-sm font-medium text-neutral-950">{row.label}</p>
            <p className="mt-0.5 text-xs text-neutral-500">
              {KIND_LABELS[row.kind] ?? row.kind}
              {row.required && " ・ 必須"}
              {row.removed && " ・ 現在の案件にない項目"}
            </p>
          </div>
          <div className="min-w-0 space-y-1">
            <AnswerValue row={row} resumeUrl={resumeUrl} />
            {row.answer?.origin === "PROFILE" && <p className="text-xs text-neutral-500">プロフィールから入力</p>}
            {row.answer?.origin === "ADMIN" && row.answer.updatedAt && (
              <p className="text-xs text-neutral-500">管理者が登録（{formatDateTime(row.answer.updatedAt)}）</p>
            )}
            {row.state !== "COMPOSITE" && !row.removed && (
              editing === row.key ? (
                <AnswerEditor row={row} target={target} onDone={() => setEditing(null)} />
              ) : (
                <button
                  type="button"
                  onClick={() => setEditing(row.key)}
                  className="text-xs text-neutral-600 underline underline-offset-4 hover:text-neutral-950"
                >
                  {row.state === "ANSWERED" ? (row.kind === "PHOTO" || row.kind === "FILE" ? "差し替える" : "修正する") : "登録する"}
                </button>
              )
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}
