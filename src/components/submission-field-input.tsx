"use client"

import { useRef } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { SubmissionField } from "@/lib/submission-fields"
import { uploadSubmissionFile, UploadError } from "@/lib/client-upload"

// 1項目ぶんの入力の状態。親（応募フォーム）がまとめて持つ
export type FieldInputState = {
  value: string
  fileUrl: string | null
  fileName: string | null
  uploading: boolean
  progress: number
  // その項目の場所に出すエラー（入力の不備・アップロードの失敗）
  error: string | null
  errorCode: string | null
  // アップロードを試して失敗したことがあるか（「あとで別途送る」を出す条件）
  uploadFailed: boolean
  deferred: boolean
}

export function emptyFieldState(value = ""): FieldInputState {
  return { value, fileUrl: null, fileName: null, uploading: false, progress: 0, error: null, errorCode: null, uploadFailed: false, deferred: false }
}

const FILE_ACCEPT = "video/*,audio/*,image/*,.pdf"

export function SubmissionFieldInput({
  field,
  state,
  onChange,
  jobId,
  token,
  talentId,
  onUploadError,
}: {
  field: SubmissionField
  state: FieldInputState
  onChange: (update: Partial<FieldInputState>) => void
  jobId: string
  token?: string | null
  // 管理者が代わりにアップロードするときだけ
  talentId?: string | null
  // アップロード失敗時に受付番号を得るための処理（応募フォームから渡す）
  onUploadError?: (err: UploadError) => Promise<string | null>
}) {
  const controllerRef = useRef<AbortController | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const inputId = `field-${field.key}`

  const handleFile = async (file: File) => {
    const controller = new AbortController()
    controllerRef.current = controller
    onChange({ uploading: true, progress: 0, error: null, errorCode: null, deferred: false })
    try {
      const result = await uploadSubmissionFile({
        jobId,
        fieldKey: field.key,
        kind: field.kind === "PHOTO" ? "PHOTO" : "FILE",
        file,
        t: token,
        talentId,
        signal: controller.signal,
        onProgress: (progress) => onChange({ progress }),
      })
      onChange({ uploading: false, progress: 100, fileUrl: result.fileUrl, fileName: result.fileName })
    } catch (e) {
      const err = e instanceof UploadError ? e : null
      const aborted = err?.info.kind === "ABORTED"
      // サーバー側で記録済みならその受付番号、そうでなければ端末から報告して受付番号を得る
      const code = aborted ? null : err?.code ?? (err && onUploadError ? await onUploadError(err) : null)
      onChange({
        uploading: false,
        progress: 0,
        error: err?.info.message ?? "アップロードできませんでした",
        errorCode: aborted ? null : code,
        uploadFailed: state.uploadFailed || !aborted,
      })
    } finally {
      controllerRef.current = null
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const isFile = field.kind === "PHOTO" || field.kind === "FILE"

  return (
    <div id={inputId} className="space-y-2 border-t pt-3 first:border-t-0 first:pt-0" data-field-key={field.key}>
      <div>
        <label htmlFor={`${inputId}-input`} className="text-sm font-medium">
          {field.label}
          <span className={`ml-2 text-xs ${field.required ? "text-red-600" : "text-muted-foreground"}`}>
            {field.required ? "必須" : "任意"}
          </span>
        </label>
        {field.note && <p className="mt-0.5 whitespace-pre-wrap text-xs text-muted-foreground">{field.note}</p>}
      </div>

      {field.kind === "TEXT" && (
        <Textarea
          id={`${inputId}-input`}
          value={state.value}
          onChange={(e) => onChange({ value: e.target.value, error: null })}
          rows={2}
          maxLength={2000}
          className="text-sm"
        />
      )}

      {field.kind === "URL" && (
        <Input
          id={`${inputId}-input`}
          type="text"
          inputMode="url"
          autoComplete="url"
          value={state.value}
          onChange={(e) => onChange({ value: e.target.value, error: null })}
          placeholder="https://"
          className="text-sm"
        />
      )}

      {isFile && (
        <div className="space-y-1">
          {state.fileUrl ? (
            <div className="flex items-center gap-2 text-sm">
              <span className="truncate text-green-700">{state.fileName ?? "アップロード済み"}</span>
              <button
                type="button"
                onClick={() => onChange({ fileUrl: null, fileName: null })}
                className="shrink-0 text-xs text-red-600 hover:underline"
              >
                削除
              </button>
            </div>
          ) : state.uploading ? (
            <div className="flex items-center gap-3 text-sm" role="status">
              <div className="h-2 flex-1 overflow-hidden rounded bg-muted">
                <div className="h-full bg-primary transition-all" style={{ width: `${state.progress}%` }} />
              </div>
              <span className="w-10 text-right text-xs text-muted-foreground">{state.progress}%</span>
              <button
                type="button"
                onClick={() => controllerRef.current?.abort()}
                className="shrink-0 text-xs text-red-600 hover:underline"
              >
                中止
              </button>
            </div>
          ) : (
            <Input
              id={`${inputId}-input`}
              ref={fileInputRef}
              type="file"
              accept={field.kind === "PHOTO" ? "image/*" : FILE_ACCEPT}
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFile(file)
              }}
              className="text-sm"
            />
          )}
        </div>
      )}

      {state.deferred ? (
        <div className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-900 ring-1 ring-amber-200" role="status">
          <p>
            この項目は、応募のあとで管理者に別途送ってください
            {state.errorCode && <>（受付番号：{state.errorCode}）</>}
          </p>
          <button type="button" onClick={() => onChange({ deferred: false })} className="mt-1 underline">
            やっぱりここでアップロードする
          </button>
        </div>
      ) : (
        state.error && (
          <div className="space-y-1" role="alert">
            <p className="text-xs text-red-700">
              {state.error}
              {state.errorCode && <span className="ml-1">（受付番号：{state.errorCode}）</span>}
            </p>
            {isFile && state.uploadFailed && !state.fileUrl && !state.uploading && (
              <div className="flex flex-wrap gap-3 text-xs">
                <button type="button" onClick={() => fileInputRef.current?.click()} className="text-neutral-900 underline">
                  もう一度アップロード
                </button>
                {state.errorCode && (
                  <button type="button" onClick={() => onChange({ deferred: true, error: null })} className="text-neutral-900 underline">
                    あとで別途送る（応募は先に済ませる）
                  </button>
                )}
              </div>
            )}
          </div>
        )
      )}
    </div>
  )
}
