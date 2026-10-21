// タレント側のフォームで使う、入力欄の枠と区切りのカード
// （見た目は初回登録・設定のフォームと同じ）

import { AlertCircle } from "lucide-react"
import { PANEL } from "@/components/talent/styles"

export function Field({
  id,
  label,
  required,
  error,
  hint,
  className = "",
  children,
}: {
  id: string
  label: string
  required?: boolean
  error?: string
  hint?: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={`min-w-0 ${className}`}>
      <label htmlFor={id} className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-neutral-900">
        {label}
        {required && (
          <span className="rounded bg-neutral-950 px-1.5 py-px text-[10px] font-semibold leading-4 text-white">必須</span>
        )}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 flex items-start gap-1 text-xs text-red-600">
          <AlertCircle className="mt-px size-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
      {hint && <p className="mt-1.5 text-xs text-neutral-500">{hint}</p>}
    </div>
  )
}

export function Section({
  title,
  description,
  children,
}: {
  title: string
  description?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className={`${PANEL} p-5 sm:p-6`}>
      <h2 className="text-base font-semibold text-neutral-950">{title}</h2>
      {description && <p className="mt-1 text-sm leading-relaxed text-neutral-500">{description}</p>}
      <div className="mt-5">{children}</div>
    </section>
  )
}

// エラーのある欄を赤枠にし、読み上げでエラー文につなぐ
export function errorAttrs(id: string, error: string | undefined) {
  return {
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? `${id}-error` : undefined,
  }
}
