"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { changePassword } from "@/lib/actions/auth"
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react"
import { BTN_PRIMARY, FIELD } from "@/components/talent/styles"

export function ChangePasswordForm({ mustChangePassword = false, hasPassword = true }: { mustChangePassword?: boolean; hasPassword?: boolean }) {
  const router = useRouter()
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setSuccess(false)

    if (newPassword.length < 8) {
      setError("新しいパスワードは8文字以上で入力してください")
      return
    }
    if (newPassword !== newPasswordConfirm) {
      setError("新しいパスワードが一致しません")
      return
    }

    setLoading(true)
    const result = await changePassword(currentPassword, newPassword)
    setLoading(false)

    if (result.error) {
      setError(result.error)
      return
    }

    if (mustChangePassword) {
      router.push("/welcome")
      return
    }

    setSuccess(true)
    setCurrentPassword("")
    setNewPassword("")
    setNewPasswordConfirm("")
  }

  const label = "mb-1.5 block text-sm font-medium text-neutral-900"

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {hasPassword && (
        <div className="sm:max-w-[calc(50%-0.5rem)]">
          <label htmlFor="currentPassword" className={label}>現在のパスワード</label>
          <input
            id="currentPassword"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            autoComplete="current-password"
            className={FIELD}
          />
        </div>
      )}
      <div className="grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2">
        <div>
          <label htmlFor="newPassword" className={label}>新しいパスワード</label>
          <input
            id="newPassword"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            aria-describedby="newPassword-hint"
            className={FIELD}
          />
          <p id="newPassword-hint" className="mt-1.5 text-xs text-neutral-500">8文字以上</p>
        </div>
        <div>
          <label htmlFor="newPasswordConfirm" className={label}>新しいパスワード確認</label>
          <input
            id="newPasswordConfirm"
            type="password"
            value={newPasswordConfirm}
            onChange={(e) => setNewPasswordConfirm(e.target.value)}
            required
            autoComplete="new-password"
            className={FIELD}
          />
        </div>
      </div>
      {error && (
        <p role="alert" className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
      {success && (
        <p role="status" className="flex items-center gap-1.5 text-sm text-green-700">
          <CheckCircle2 className="size-4" aria-hidden="true" />
          パスワードを変更しました
        </p>
      )}
      <div className="flex justify-end">
        <button type="submit" disabled={loading} className={`${BTN_PRIMARY} w-full sm:w-auto sm:min-w-40`}>
          {loading && <Loader2 className="animate-spin" aria-hidden="true" />}
          {loading ? "設定中..." : hasPassword ? "パスワードを変更" : "パスワードを設定"}
        </button>
      </div>
    </form>
  )
}
