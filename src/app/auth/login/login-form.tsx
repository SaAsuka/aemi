"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Loader2, MailCheck } from "lucide-react"
import { passwordLogin, requestPasswordReset } from "@/lib/actions/auth"
import {
  AuthHeading,
  FieldError,
  INPUT_CLASS,
  INPUT_ERROR,
  INPUT_OK,
  LABEL_CLASS,
  PasswordInput,
  PRIMARY_BUTTON,
  SECONDARY_BUTTON,
  TEXT_BUTTON,
} from "@/components/auth/auth-form"

export function TalentLoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get("redirect") || undefined
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<"login" | "reset" | "resetSent" | "noPassword">("login")

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

  const hasError = Boolean(error)

  if (mode === "resetSent") {
    return (
      <div>
        <div className="flex size-12 items-center justify-center rounded-full bg-neutral-100">
          <MailCheck className="size-6 text-neutral-950" aria-hidden="true" />
        </div>
        <AuthHeading
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
        <AuthHeading
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
        <AuthHeading
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
            <label htmlFor="reset-email" className={LABEL_CLASS}>
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
            <FieldError id="login-error" error={error} />
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
      <AuthHeading
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
            <label htmlFor="login-email" className={LABEL_CLASS}>
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
            <label htmlFor="login-password" className={LABEL_CLASS}>
              パスワード
            </label>
            <PasswordInput
              id="login-password"
              value={password}
              onChange={(v) => {
                setPassword(v)
                if (error) setError("")
              }}
              readOnly={loading}
              autoComplete="current-password"
              enterKeyHint="go"
              invalid={hasError}
              describedBy={hasError ? "login-error" : undefined}
            />
            <FieldError id="login-error" error={error} />
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
