"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react"
import { adminLogin } from "@/lib/actions/auth"

// サーバーから応答が返らないまま待たせ続けないための上限（Vercelのコールドスタートを見込んで長めに取る）
const LOGIN_TIMEOUT_MS = 15_000
const TIMEOUT = Symbol("timeout")

export function AdminLoginForm() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [capsLock, setCapsLock] = useState(false)

  // PCは開いてすぐ入力できるようにする。スマホは画面を見せる前にキーボードが出ないよう自動フォーカスしない
  useEffect(() => {
    if (window.matchMedia("(min-width: 1024px)").matches) {
      inputRef.current?.focus()
    }
  }, [])

  function focusInput() {
    inputRef.current?.focus()
    inputRef.current?.select()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return

    if (!password) {
      setError("パスワードを入力してください")
      focusInput()
      return
    }

    setLoading(true)
    setError("")

    // 通信が切れた・サーバーが落ちた等で例外になっても「ログイン中…」のまま止まらないようにする
    let result: Awaited<ReturnType<typeof adminLogin>> | typeof TIMEOUT
    let timer: ReturnType<typeof setTimeout> | undefined
    try {
      result = await Promise.race([
        adminLogin(password),
        new Promise<typeof TIMEOUT>((resolve) => {
          timer = setTimeout(() => resolve(TIMEOUT), LOGIN_TIMEOUT_MS)
        }),
      ])
    } catch {
      setError("通信に失敗しました。もう一度お試しください")
      setLoading(false)
      return
    } finally {
      clearTimeout(timer)
    }

    if (result === TIMEOUT) {
      // 遅れて届いた応答は race が決着済みなので捨てられる
      setError("応答がありません。もう一度お試しください")
      setLoading(false)
      return
    }

    if (result.error) {
      setError(result.error)
      setLoading(false)
      requestAnimationFrame(focusInput)
    } else {
      router.push("/admin")
    }
  }

  function handleKeyEvent(e: React.KeyboardEvent<HTMLInputElement>) {
    setCapsLock(e.getModifierState?.("CapsLock") ?? false)
  }

  const hasError = Boolean(error)

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {/* パスワード管理ツールが「管理者」のパスワードとして保存できるようにするための項目（送信には使わない） */}
      <input
        type="text"
        name="username"
        autoComplete="username"
        value="admin"
        readOnly
        tabIndex={-1}
        aria-hidden="true"
        className="sr-only"
      />

      <div className="space-y-2">
        <label
          htmlFor="admin-password"
          className="block text-sm font-medium text-neutral-900"
        >
          パスワード
        </label>
        <div className="relative">
          <input
            ref={inputRef}
            id="admin-password"
            name="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              if (error) setError("")
            }}
            onKeyDown={handleKeyEvent}
            onKeyUp={handleKeyEvent}
            onBlur={() => setCapsLock(false)}
            readOnly={loading}
            autoComplete="current-password"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="go"
            aria-invalid={hasError}
            aria-describedby={hasError ? "admin-password-error" : undefined}
            className={`block h-12 w-full rounded-lg border bg-white pl-4 pr-12 text-base text-neutral-950 outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-neutral-400 ${
              hasError
                ? "border-red-600 focus:ring-4 focus:ring-red-600/15"
                : "border-neutral-300 hover:border-neutral-400 focus:border-neutral-950 focus:ring-4 focus:ring-neutral-950/10"
            }`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "パスワードを隠す" : "パスワードを表示する"}
            aria-pressed={showPassword}
            aria-controls="admin-password"
            className="absolute inset-y-0 right-1 my-auto flex size-10 items-center justify-center rounded-md text-neutral-500 transition-colors hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950"
          >
            {showPassword ? (
              <EyeOff className="size-5" aria-hidden="true" />
            ) : (
              <Eye className="size-5" aria-hidden="true" />
            )}
          </button>
        </div>

        <div aria-live="polite" className="space-y-1.5">
          {hasError && (
            <p
              id="admin-password-error"
              role="alert"
              className="flex items-start gap-1.5 text-sm text-red-600"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </p>
          )}
          {capsLock && (
            <p className="flex items-start gap-1.5 text-sm text-amber-700">
              <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>Caps Lock がオンになっています</span>
            </p>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-neutral-950 text-base font-medium text-white transition-[background-color,transform] duration-150 hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-neutral-950/20 active:scale-[0.99] disabled:cursor-wait disabled:bg-neutral-800"
      >
        {loading ? (
          <>
            <Loader2 className="size-5 animate-spin" aria-hidden="true" />
            ログイン中…
          </>
        ) : (
          "ログイン"
        )}
      </button>
    </form>
  )
}
