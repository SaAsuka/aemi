"use client"

import { useState } from "react"
import { requestMagicLink } from "@/lib/actions/auth"

export default function TalentLoginPage() {
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const result = await requestMagicLink(email)
    if (result.error) {
      setError(result.error)
      setLoading(false)
    } else {
      setSent(true)
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-full max-w-sm space-y-4 p-6 text-center">
          <h1 className="text-2xl font-bold">メール送信完了</h1>
          <p className="text-sm text-muted-foreground">
            {email} にログインリンクを送信しました。<br />メールを確認してリンクをクリックしてください。
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm space-y-6 p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">VOZEL</h1>
          <p className="text-sm text-muted-foreground mt-1">メールアドレスでログイン</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
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
            {loading ? "送信中..." : "ログインリンクを送信"}
          </button>
        </form>
      </div>
    </div>
  )
}
