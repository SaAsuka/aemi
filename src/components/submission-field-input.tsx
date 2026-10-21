"use client"

import { useRef } from "react"
import { AlertCircle, FileCheck2, Loader2 } from "lucide-react"
import { FIELD, FILE_FIELD, TEXTAREA } from "@/components/talent/styles"
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
  prefill,
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
  // 名前・年齢・身長の項目：プロフィールから入れた値と、年齢を書き換え不可にするか
  prefill?: { value: string; locked: boolean }
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
    <div id={inputId} className="space-y-2 py-4 first:pt-0 last:pb-0" data-field-key={field.key}>
      <div>
        <label htmlFor={`${inputId}-input`} className="flex items-center gap-1.5 text-sm font-medium text-neutral-900">
          {field.label}
          {field.required ? (
            <span className="rounded bg-neutral-950 px-1.5 py-px text-[10px] font-semibold leading-4 text-white">必須</span>
          ) : (
            <span className="text-xs font-normal text-neutral-500">任意</span>
          )}
        </label>
        {field.note && <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-neutral-500">{field.note}</p>}
      </div>

      {field.kind === "TEXT" && prefill && (
        <div className="space-y-1.5">
          <input
            id={`${inputId}-input`}
            type="text"
            inputMode={field.autofill === "NAME" ? "text" : "numeric"}
            value={state.value}
            readOnly={prefill.locked}
            aria-readonly={prefill.locked || undefined}
            aria-invalid={!!state.error || undefined}
            onChange={(e) => onChange({ value: e.target.value, error: null })}
            maxLength={2000}
            className={FIELD}
          />
          {field.autofill === "AGE" && prefill.locked ? (
            <p className="text-xs leading-relaxed text-neutral-500">
              年齢は生年月日から計算しています。違う場合は
              <a href="/mypage/settings" className="font-medium text-neutral-900 underline underline-offset-2">設定画面</a>
              で生年月日を直してください
            </p>
          ) : field.autofill === "AGE" ? (
            <p className="text-xs leading-relaxed text-neutral-500">設定画面で生年月日を登録すると、次から自動で入ります</p>
          ) : prefill.value ? (
            <p className="text-xs leading-relaxed text-neutral-500">
              プロフィールの内容を入れています。この応募だけ変えたい場合は書き換えてください（プロフィールは変わりません）
            </p>
          ) : null}
        </div>
      )}

      {field.kind === "TEXT" && !prefill && (
        <textarea
          id={`${inputId}-input`}
          value={state.value}
          onChange={(e) => onChange({ value: e.target.value, error: null })}
          rows={2}
          maxLength={2000}
          aria-invalid={!!state.error || undefined}
          className={TEXTAREA}
        />
      )}

      {field.kind === "URL" && (
        <input
          id={`${inputId}-input`}
          type="text"
          inputMode="url"
          autoComplete="url"
          autoCapitalize="none"
          spellCheck={false}
          value={state.value}
          onChange={(e) => onChange({ value: e.target.value, error: null })}
          placeholder="https://"
          aria-invalid={!!state.error || undefined}
          className={FIELD}
        />
      )}

      {isFile && (
        <div className="space-y-1">
          {state.fileUrl ? (
            <div className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm">
              <FileCheck2 className="size-4 shrink-0 text-green-700" aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate text-neutral-900">{state.fileName ?? "アップロード済み"}</span>
              <button
                type="button"
                onClick={() => onChange({ fileUrl: null, fileName: null })}
                className="shrink-0 rounded px-1.5 py-0.5 text-xs font-medium text-red-600 hover:bg-red-50"
              >
                削除
              </button>
            </div>
          ) : state.uploading ? (
            <div className="flex items-center gap-3 rounded-lg border border-neutral-200 px-3 py-3 text-sm" role="status">
              <Loader2 className="size-4 shrink-0 animate-spin text-neutral-500" aria-hidden="true" />
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-neutral-100">
                <div className="h-full rounded-full bg-neutral-950 transition-all" style={{ width: `${state.progress}%` }} />
              </div>
              <span className="w-10 text-right text-xs tabular-nums text-neutral-500">{state.progress}%</span>
              <button
                type="button"
                onClick={() => controllerRef.current?.abort()}
                className="shrink-0 rounded px-1.5 py-0.5 text-xs font-medium text-red-600 hover:bg-red-50"
              >
                中止
              </button>
            </div>
          ) : (
            <input
              id={`${inputId}-input`}
              ref={fileInputRef}
              type="file"
              accept={field.kind === "PHOTO" ? "image/*" : FILE_ACCEPT}
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFile(file)
              }}
              className={FILE_FIELD}
            />
          )}
        </div>
      )}

      {state.deferred ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-900" role="status">
          <p>
            この項目は、応募のあとで管理者に別途送ってください
            {state.errorCode && <>（受付番号：{state.errorCode}）</>}
          </p>
          <button type="button" onClick={() => onChange({ deferred: false })} className="mt-1 font-medium underline underline-offset-2">
            やっぱりここでアップロードする
          </button>
        </div>
      ) : (
        state.error && (
          <div className="space-y-1.5" role="alert">
            <p className="flex items-start gap-1 text-xs text-red-600">
              <AlertCircle className="mt-px size-3.5 shrink-0" aria-hidden="true" />
              <span>
                {state.error}
                {state.errorCode && <span className="ml-1">（受付番号：{state.errorCode}）</span>}
              </span>
            </p>
            {isFile && state.uploadFailed && !state.fileUrl && !state.uploading && (
              <div className="flex flex-wrap gap-x-4 gap-y-1 pl-4.5 text-xs">
                <button type="button" onClick={() => fileInputRef.current?.click()} className="font-medium text-neutral-900 underline underline-offset-2">
                  もう一度アップロード
                </button>
                {state.errorCode && (
                  <button type="button" onClick={() => onChange({ deferred: true, error: null })} className="font-medium text-neutral-900 underline underline-offset-2">
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
