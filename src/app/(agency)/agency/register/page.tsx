"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { registerAgency } from "@/lib/actions/agency-auth"

export default function AgencyRegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const result = await registerAgency(new FormData(e.currentTarget as HTMLFormElement))
      if (result.error) {
        setError(result.error)
        setLoading(false)
      } else {
        router.push("/agency/verify-sent")
      }
    } catch {
      setError("エラーが発生しました。時間をおいて再度お試しください。")
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm space-y-6 rounded-xl border bg-white p-8 shadow-sm">
        <div className="text-center">
          <h1 className="text-2xl font-bold">事務所アカウント登録</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">事務所名</label>
            <input
              name="name"
              type="text"
              required
              placeholder="株式会社○○事務所"
              className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">メールアドレス</label>
            <input
              name="email"
              type="email"
              required
              placeholder="info@example.com"
              className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">パスワード</label>
            <input
              name="password"
              type="password"
              required
              minLength={8}
              placeholder="8文字以上"
              className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-primary px-3 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {loading ? "登録中..." : "アカウントを作成する"}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          すでにアカウントをお持ちの方は{" "}
          <Link href="/agency/login" className="text-primary hover:underline">
            ログイン
          </Link>
        </p>
      </div>
    </div>
  )
}
