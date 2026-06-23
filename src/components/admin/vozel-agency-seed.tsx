"use client"

import { useState } from "react"
import { seedVozelAgency } from "@/lib/actions/agency-seed"
import { Button } from "@/components/ui/button"

export function VozelAgencySeed() {
  const [name, setName] = useState("VOZEL")
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success?: boolean; message?: string; updated?: number; error?: string } | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!confirm(`「${name}」を代理店として登録し、既存の全タレント・案件・クライアント・オプションを紐付けます。よろしいですか？`)) return
    setLoading(true)
    setResult(null)
    try {
      const res = await seedVozelAgency(name, email)
      setResult(res)
    } catch {
      setResult({ error: "エラーが発生しました" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <label className="text-sm font-medium">事務所名</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium">メールアドレス</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="info@vozel.jp"
          required
          className="w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>

      {result?.success && (
        <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          ✅ {result.message}（更新件数: {result.updated}件）
        </div>
      )}
      {result?.error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          {result.error}
        </div>
      )}

      <Button type="submit" disabled={loading} variant="outline">
        {loading ? "処理中..." : "代理店を作成して既存データを紐付ける"}
      </Button>
      <p className="text-xs text-muted-foreground">
        ※ agencyId が未設定のデータのみ更新されます。一度実行済みの場合は重複しません。
      </p>
    </form>
  )
}
