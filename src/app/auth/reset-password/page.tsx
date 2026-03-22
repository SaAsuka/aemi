"use client"

import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { resetPassword } from "@/lib/actions/auth"

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const [password, setPassword] = useState("")
  const [passwordConfirm, setPasswordConfirm] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  if (!token) {
    return (
      <div className="w-full max-w-sm space-y-4 p-6 text-center">
        <h1 className="text-xl font-bold text-red-600">エラー</h1>
        <p className="text-sm text-muted-foreground">トークンがありません</p>
        <a href="/auth/login" className="text-sm text-primary hover:underline">
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
    <div className="w-full max-w-sm space-y-6 p-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">パスワード設定</h1>
        <p className="text-sm text-muted-foreground mt-1">新しいパスワードを入力してください</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="新しいパスワード（8文字以上）"
          required
          minLength={8}
          className="w-full rounded-md border px-3 py-2 text-sm"
        />
        <input
          type="password"
          value={passwordConfirm}
          onChange={(e) => setPasswordConfirm(e.target.value)}
          placeholder="パスワード確認"
          required
          className="w-full rounded-md border px-3 py-2 text-sm"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {loading ? "設定中..." : "パスワードを設定"}
        </button>
      </form>
      <div className="text-center">
        <a href="/auth/login" className="text-sm text-muted-foreground hover:underline">
          ログインに戻る
        </a>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Suspense fallback={<p className="text-sm text-muted-foreground">読み込み中...</p>}>
        <ResetPasswordContent />
      </Suspense>
    </div>
  )
}
