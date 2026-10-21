"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AlertCircle, ArrowLeft, Loader2 } from "lucide-react"
import { resetPassword } from "@/lib/actions/auth"
import {
  AuthHeading,
  LABEL_CLASS,
  PasswordInput,
  PRIMARY_BUTTON,
  SECONDARY_BUTTON,
  TEXT_BUTTON,
} from "@/components/auth/auth-form"

export function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const [password, setPassword] = useState("")
  const [passwordConfirm, setPasswordConfirm] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  if (!token) {
    return (
      <div>
        <div className="flex size-12 items-center justify-center rounded-full bg-red-50">
          <AlertCircle className="size-6 text-red-600" aria-hidden="true" />
        </div>
        <AuthHeading
          title="リンクが正しくありません"
          description={
            <>
              <span className="inline-block">メールに記載されたリンクをもう一度開くか、</span>
              <span className="inline-block">ログイン画面からやり直してください。</span>
            </>
          }
          className="mt-6"
        />
        <a href="/auth/login" className={`${SECONDARY_BUTTON} mt-8`}>
          ログインページに戻る
        </a>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (password !== passwordConfirm) {
      setError("パスワードが一致しません")
      return
    }
    if (password.length < 8) {
      setError("パスワードは8文字以上で入力してください")
      return
    }

    setLoading(true)
    const result = await resetPassword(token!, password)
    setLoading(false)

    if (result.error) {
      setError(result.error)
      return
    }
    if (result.redirect) {
      router.push(result.redirect)
    }
  }

  return (
    <div>
      <AuthHeading
        title="パスワード設定"
        description="新しいパスワードを入力してください。"
      />
      <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-6">
        <div className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="new-password" className={LABEL_CLASS}>
              新しいパスワード
            </label>
            <PasswordInput
              id="new-password"
              value={password}
              onChange={(v) => {
                setPassword(v)
                if (error) setError("")
              }}
              readOnly={loading}
              autoComplete="new-password"
              enterKeyHint="next"
              describedBy="new-password-hint"
            />
            <p id="new-password-hint" className="text-xs text-neutral-500">
              8文字以上で入力してください
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="new-password-confirm" className={LABEL_CLASS}>
              新しいパスワード（確認）
            </label>
            <PasswordInput
              id="new-password-confirm"
              value={passwordConfirm}
              onChange={(v) => {
                setPasswordConfirm(v)
                if (error) setError("")
              }}
              readOnly={loading}
              autoComplete="new-password"
              enterKeyHint="done"
            />
          </div>
        </div>

        {/* 入力の不備とリンク切れの両方が入るので、項目の枠ではなくフォーム全体のお知らせとして出す */}
        <div aria-live="polite">
          {error && (
            <p
              role="alert"
              className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span className="text-pretty">{error}</span>
            </p>
          )}
        </div>

        <button type="submit" disabled={loading} className={PRIMARY_BUTTON}>
          {loading ? (
            <>
              <Loader2 className="size-5 animate-spin" aria-hidden="true" />
              設定中…
            </>
          ) : (
            "パスワードを設定"
          )}
        </button>
      </form>

      <div className="mt-8 border-t border-neutral-200 pt-6">
        <a href="/auth/login" className={TEXT_BUTTON}>
          <ArrowLeft className="size-4" aria-hidden="true" />
          ログインに戻る
        </a>
      </div>
    </div>
  )
}
