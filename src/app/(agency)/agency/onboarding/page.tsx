"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { completeOnboarding } from "@/lib/actions/agency-auth"

export default function AgencyOnboardingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError("")
    const result = await completeOnboarding(new FormData(e.currentTarget))
    if (result.error) {
      setError(result.error)
      setLoading(false)
    } else {
      router.push("/agency/subscribe")
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-6 rounded-xl border bg-white p-8 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">ステップ 1 / 3</span>
          </div>
          <h1 className="text-xl font-bold">事務所情報の設定</h1>
          <p className="text-sm text-muted-foreground mt-1">連絡先情報を入力してください（後から変更できます）</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">担当者名</label>
            <input
              name="contactName"
              type="text"
              placeholder="山田 太郎"
              className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">電話番号</label>
            <input
              name="contactPhone"
              type="tel"
              placeholder="03-0000-0000"
              className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">住所</label>
            <input
              name="address"
              type="text"
              placeholder="東京都渋谷区..."
              className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-primary px-3 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {loading ? "保存中..." : "次へ進む"}
          </button>
        </form>
      </div>
    </div>
  )
}
