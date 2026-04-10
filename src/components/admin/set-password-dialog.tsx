"use client"

import { useState } from "react"
import { KeyRound } from "lucide-react"
import { setTalentPasswordByAdmin } from "@/lib/actions/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"

export function SetPasswordDialog({ talentId, talentName }: { talentId: string; talentName: string }) {
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState("")
  const [passwordConfirm, setPasswordConfirm] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  function handleClose() {
    setOpen(false)
    setPassword("")
    setPasswordConfirm("")
    setError("")
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (password.length < 8) {
      setError("パスワードは8文字以上で入力してください")
      return
    }
    if (password !== passwordConfirm) {
      setError("パスワードが一致しません")
      return
    }

    setLoading(true)
    const result = await setTalentPasswordByAdmin(talentId, password)
    setLoading(false)

    if (result.error) {
      setError(result.error)
      return
    }

    handleClose()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => v ? setOpen(true) : handleClose()}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <KeyRound className="h-4 w-4" />
        PW設定
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{talentName} のパスワード設定</DialogTitle>
            <DialogDescription>
              設定後、タレントは初回ログイン時にパスワード変更を求められます。
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-set-pw">新しいパスワード</Label>
              <Input
                id="admin-set-pw"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-set-pw-confirm">パスワード確認</Label>
              <Input
                id="admin-set-pw-confirm"
                type="password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter className="mt-4">
            <Button type="submit" disabled={loading}>
              {loading ? "設定中..." : "パスワードを設定"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
