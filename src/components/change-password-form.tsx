"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { changePassword } from "@/lib/actions/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function ChangePasswordForm({ mustChangePassword = false }: { mustChangePassword?: boolean }) {
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
      router.push("/mypage")
      return
    }

    setSuccess(true)
    setCurrentPassword("")
    setNewPassword("")
    setNewPasswordConfirm("")
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="currentPassword">現在のパスワード</Label>
        <Input
          id="currentPassword"
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="newPassword">新しいパスワード</Label>
          <Input
            id="newPassword"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={8}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="newPasswordConfirm">新しいパスワード確認</Label>
          <Input
            id="newPasswordConfirm"
            type="password"
            value={newPasswordConfirm}
            onChange={(e) => setNewPasswordConfirm(e.target.value)}
            required
          />
        </div>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && <p className="text-sm text-green-600">パスワードを変更しました</p>}
      <Button type="submit" disabled={loading}>
        {loading ? "変更中..." : "パスワードを変更"}
      </Button>
    </form>
  )
}
