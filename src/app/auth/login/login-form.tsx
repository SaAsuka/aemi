"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AlertCircle, ArrowLeft, Eye, EyeOff, Loader2, MailCheck } from "lucide-react"
import { passwordLogin, requestPasswordReset } from "@/lib/actions/auth"

const INPUT_CLASS =
  "block h-12 w-full rounded-lg border bg-white px-4 text-base text-neutral-950 outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-neutral-400"
const INPUT_OK =
  "border-neutral-300 hover:border-neutral-400 focus:border-neutral-950 focus:ring-4 focus:ring-neutral-950/10"
const INPUT_ERROR = "border-red-600 focus:ring-4 focus:ring-red-600/15"

const PRIMARY_BUTTON =
  "flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-neutral-950 text-base font-medium text-white transition-[background-color,transform] duration-150 hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-neutral-950/20 active:scale-[0.99] disabled:cursor-wait disabled:bg-neutral-800"
const SECONDARY_BUTTON =
  "flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-neutral-300 bg-white text-base font-medium text-neutral-950 transition-[background-color,border-color,transform] duration-150 hover:border-neutral-400 hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-neutral-950/10 active:scale-[0.99]"
const TEXT_BUTTON =
  "inline-flex items-center gap-1.5 rounded-sm text-sm text-neutral-500 underline-offset-4 transition-colors hover:text-neutral-950 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950"

export function TalentLoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get("redirect") || undefined
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<"login" | "reset" | "resetSent" | "noPassword">("login")
  const [showPassword, setShowPassword] = useState(false)
  const [capsLock, setCapsLock] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const result = await passwordLogin(email, password, redirectTo)
    setLoading(false)

    if (result.error === "NO_PASSWORD") {
      setMode("noPassword")
      return
    }
    if (result.error) {
      setError(result.error)
      return
    }
    if (result.redirect) {
      router.push(result.redirect)
    }
  }

  async function handleResetRequest(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    await requestPasswordReset(email)
    setLoading(false)
    setMode("resetSent")
  }

  async function handleSendResetFromNoPassword() {
    setLoading(true)
    await requestPasswordReset(email)
    setLoading(false)
    setMode("resetSent")
  }

  function handleKeyEvent(e: React.KeyboardEvent<HTMLInputElement>) {
    setCapsLock(e.getModifierState?.("CapsLock") ?? false)
  }

  const hasError = Boolean(error)

  if (mode === "resetSent") {
    return (
      <div>
        <div className="flex size-12 items-center justify-center rounded-full bg-neutral-100">
          <MailCheck className="size-6 text-neutral-950" aria-hidden="true" />
        </div>
        <Heading
          title="メール送信完了"
          description={
            <>
              <span className="break-all font-medium text-neutral-950">{email}</span>{" "}
              <span className="inline-block">にパスワード設定リンクを送信しました。</span>
              <span className="inline-block">メールを確認してリンクをクリックしてください。</span>
            </>
          }
          className="mt-6"
        />
        <button
          type="button"
          onClick={() => setMode("login")}
          className={`${SECONDARY_BUTTON} mt-8`}
        >
          ログインに戻る
        </button>
      </div>
    )
  }

  if (mode === "noPassword") {
    return (
      <div>
        <Heading
          title="パスワード未設定"
          description={
            <>
              このアカウントにはパスワードが設定されていません。
              <span className="inline-block">メールでパスワード設定リンクを送信します。</span>
            </>
          }
        />
        <div className="mt-8 space-y-3">
          <button
            type="button"
            onClick={handleSendResetFromNoPassword}
            disabled={loading}
            className={PRIMARY_BUTTON}
          >
            {loading ? (
              <>
                <Loader2 className="size-5 animate-spin" aria-hidden="true" />
                送信中…
              </>
            ) : (
              "パスワード設定メールを送信"
            )}
          </button>
          <button
            type="button"
            onClick={() => setMode("login")}
            className={SECONDARY_BUTTON}
          >
            ログインに戻る
          </button>
        </div>
      </div>
    )
  }

  if (mode === "reset") {
    return (
      <div>
        <Heading
          title="パスワードリセット"
          description={
            <>
              <span className="inline-block">登録済みのメールアドレスを入力してください。</span>
              <span className="inline-block">パスワード設定リンクをお送りします。</span>
            </>
          }
        />
        <form onSubmit={handleResetRequest} noValidate className="mt-8 space-y-6">
          <div className="space-y-2">
            <label htmlFor="reset-email" className="block text-sm font-medium text-neutral-900">
              メールアドレス
            </label>
            <input
              id="reset-email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (error) setError("")
              }}
              readOnly={loading}
              autoComplete="email"
              inputMode="email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="send"
              aria-invalid={hasError}
              aria-describedby={hasError ? "login-error" : undefined}
              className={`${INPUT_CLASS} ${hasError ? INPUT_ERROR : INPUT_OK}`}
            />
            <ErrorMessage error={error} />
          </div>
          <button type="submit" disabled={loading} className={PRIMARY_BUTTON}>
            {loading ? (
              <>
                <Loader2 className="size-5 animate-spin" aria-hidden="true" />
                送信中…
              </>
            ) : (
              "リセットメールを送信"
            )}
          </button>
        </form>
        <div className="mt-8 border-t border-neutral-200 pt-6">
          <button
            type="button"
            onClick={() => { setMode("login"); setError("") }}
            className={TEXT_BUTTON}
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            ログインに戻る
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <Heading
        title="ログイン"
        description={
          <>
            登録したメールアドレスと
            <span className="inline-block">パスワードを入力してください。</span>
          </>
        }
      />
      <form onSubmit={handleLogin} noValidate className="mt-8 space-y-6">
        <div className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="login-email" className="block text-sm font-medium text-neutral-900">
              メールアドレス
            </label>
            <input
              id="login-email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (error) setError("")
              }}
              readOnly={loading}
              autoComplete="username"
              inputMode="email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="next"
              aria-invalid={hasError}
              aria-describedby={hasError ? "login-error" : undefined}
              className={`${INPUT_CLASS} ${hasError ? INPUT_ERROR : INPUT_OK}`}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="login-password" className="block text-sm font-medium text-neutral-900">
              パスワード
            </label>
            <div className="relative">
              <input
                id="login-password"
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
                aria-describedby={hasError ? "login-error" : undefined}
                className={`${INPUT_CLASS} pr-12 ${hasError ? INPUT_ERROR : INPUT_OK}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "パスワードを隠す" : "パスワードを表示する"}
                aria-pressed={showPassword}
                aria-controls="login-password"
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
              <ErrorMessage error={error} />
              {capsLock && (
                <p className="flex items-start gap-1.5 text-sm text-amber-700">
                  <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  <span>Caps Lock がオンになっています</span>
                </p>
              )}
            </div>
          </div>
        </div>

        <button type="submit" disabled={loading} className={PRIMARY_BUTTON}>
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

      <div className="mt-8 border-t border-neutral-200 pt-6">
        <button
          type="button"
          onClick={() => { setMode("reset"); setError("") }}
          className={TEXT_BUTTON}
        >
          パスワードを忘れた方
        </button>
      </div>
    </div>
  )
}

function Heading({
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

function ErrorMessage({ error }: { error: string }) {
  if (!error) return null
  return (
    <p id="login-error" role="alert" className="flex items-start gap-1.5 text-sm text-red-600">
      <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <span className="text-pretty">{error}</span>
    </p>
  )
}
