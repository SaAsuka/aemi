"use client"

// タレント側の認証画面で共通に使う、見出し・入力欄・ボタンの見た目

import { useState } from "react"
import { AlertCircle, Eye, EyeOff } from "lucide-react"

export const INPUT_CLASS =
  "block h-12 w-full rounded-lg border bg-white px-4 text-base text-neutral-950 outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-neutral-400"
export const INPUT_OK =
  "border-neutral-300 hover:border-neutral-400 focus:border-neutral-950 focus:ring-4 focus:ring-neutral-950/10"
export const INPUT_ERROR = "border-red-600 focus:ring-4 focus:ring-red-600/15"

export const LABEL_CLASS = "block text-sm font-medium text-neutral-900"

export const PRIMARY_BUTTON =
  "flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-neutral-950 text-base font-medium text-white transition-[background-color,transform] duration-150 hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-neutral-950/20 active:scale-[0.99] disabled:cursor-wait disabled:bg-neutral-800"
export const SECONDARY_BUTTON =
  "flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-neutral-300 bg-white text-base font-medium text-neutral-950 transition-[background-color,border-color,transform] duration-150 hover:border-neutral-400 hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-neutral-950/10 active:scale-[0.99]"
export const TEXT_BUTTON =
  "inline-flex items-center gap-1.5 rounded-sm text-sm text-neutral-500 underline-offset-4 transition-colors hover:text-neutral-950 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950"

export function AuthHeading({
  title,
  description,
  className = "",
}: {
  title: string
  description: React.ReactNode
  className?: string
}) {
  return (
    <div className={className}>
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-2 text-sm leading-relaxed text-neutral-500">{description}</p>
    </div>
  )
}

export function FieldError({ id, error }: { id: string; error: string }) {
  if (!error) return null
  return (
    <p id={id} role="alert" className="flex items-start gap-1.5 text-sm text-red-600">
      <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <span className="text-pretty">{error}</span>
    </p>
  )
}

// 表示切替と Caps Lock の注意付きのパスワード入力欄
export function PasswordInput({
  id,
  value,
  onChange,
  readOnly,
  autoComplete,
  enterKeyHint,
  invalid,
  describedBy,
}: {
  id: string
  value: string
  onChange: (value: string) => void
  readOnly?: boolean
  autoComplete: "current-password" | "new-password"
  enterKeyHint?: "next" | "go" | "done"
  invalid?: boolean
  describedBy?: string
}) {
  const [showPassword, setShowPassword] = useState(false)
  const [capsLock, setCapsLock] = useState(false)

  function handleKeyEvent(e: React.KeyboardEvent<HTMLInputElement>) {
    setCapsLock(e.getModifierState?.("CapsLock") ?? false)
  }

  return (
    <>
      <div className="relative">
        <input
          id={id}
          name={id}
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyEvent}
          onKeyUp={handleKeyEvent}
          onBlur={() => setCapsLock(false)}
          readOnly={readOnly}
          autoComplete={autoComplete}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint={enterKeyHint}
          aria-invalid={invalid}
          aria-describedby={describedBy}
          className={`${INPUT_CLASS} pr-12 ${invalid ? INPUT_ERROR : INPUT_OK}`}
        />
        <button
          type="button"
          onClick={() => setShowPassword((v) => !v)}
          aria-label={showPassword ? "パスワードを隠す" : "パスワードを表示する"}
          aria-pressed={showPassword}
          aria-controls={id}
          className="absolute inset-y-0 right-1 my-auto flex size-10 items-center justify-center rounded-md text-neutral-500 transition-colors hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950"
        >
          {showPassword ? (
            <EyeOff className="size-5" aria-hidden="true" />
          ) : (
            <Eye className="size-5" aria-hidden="true" />
          )}
        </button>
      </div>
      {capsLock && (
        <p aria-live="polite" className="flex items-start gap-1.5 text-sm text-amber-700">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>Caps Lock がオンになっています</span>
        </p>
      )}
    </>
  )
}
