"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { passwordLogin, requestPasswordReset } from "@/lib/actions/auth"

export default function TalentLoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  )
}

function LoginContent() {
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

  if (mode === "resetSent") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-full max-w-sm space-y-4 p-6 text-center">
          <h1 className="text-2xl font-bold">メール送信完了</h1>
          <p className="text-sm text-muted-foreground">
            {email} にパスワード設定リンクを送信しました。<br />メールを確認してリンクをクリックしてください。
          </p>
          <button
            onClick={() => setMode("login")}
            className="text-sm text-primary hover:underline"
          >
            ログインに戻る
          </button>
        </div>
      </div>
    )
  }

  if (mode === "noPassword") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-full max-w-sm space-y-4 p-6 text-center">
          <h1 className="text-2xl font-bold">パスワード未設定</h1>
          <p className="text-sm text-muted-foreground">
            このアカウントにはパスワードが設定されていません。<br />メールでパスワード設定リンクを送信します。
          </p>
          <button
            onClick={handleSendResetFromNoPassword}
            disabled={loading}
            className="w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {loading ? "送信中..." : "パスワード設定メールを送信"}
          </button>
          <button
            onClick={() => setMode("login")}
            className="text-sm text-primary hover:underline"
          >
            ログインに戻る
          </button>
        </div>
      </div>
    )
  }

  if (mode === "reset") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-full max-w-sm space-y-6 p-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold">パスワードリセット</h1>
            <p className="text-sm text-muted-foreground mt-1">登録済みのメールアドレスを入力してください</p>
          </div>
          <form onSubmit={handleResetRequest} className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="メールアドレス"
              required
              className="w-full rounded-md border px-3 py-2 text-sm"
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {loading ? "送信中..." : "リセットメールを送信"}
            </button>
          </form>
          <div className="text-center">
            <button
              onClick={() => { setMode("login"); setError("") }}
              className="text-sm text-primary hover:underline"
            >
              ログインに戻る
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm space-y-6 p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">VOZEL</h1>
          <p className="text-sm text-muted-foreground mt-1">ログイン</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="メールアドレス"
            required
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="パスワード"
            required
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {loading ? "ログイン中..." : "ログイン"}
          </button>
        </form>
        <div className="text-center">
          <button
            onClick={() => { setMode("reset"); setError("") }}
            className="text-sm text-muted-foreground hover:underline"
          >
            パスワードを忘れた方
          </button>
        </div>
      </div>
    </div>
  )
}
