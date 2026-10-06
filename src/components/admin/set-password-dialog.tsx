"use client"

import { useState } from "react"
import { toast } from "sonner"
import { AlertCircle, KeyRound, Loader2 } from "lucide-react"
import { setTalentPasswordByAdmin } from "@/lib/actions/auth"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { BTN_PRIMARY, BTN_SECONDARY, FIELD } from "@/components/admin/styles"

export function SetPasswordDialog({
  talentId,
  talentName,
  className = BTN_SECONDARY,
}: {
  talentId: string
  talentName: string
  className?: string
}) {
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
    toast.success(`${talentName}さんのパスワードを設定しました`, {
      description: "本人に伝えてください。初回ログイン時に変更を求められます。",
    })
  }

  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}>
        <KeyRound aria-hidden="true" />
        パスワード設定
      </button>
      <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : handleClose())}>
        <DialogContent className="gap-0 bg-white p-6 sm:max-w-md">
          <form onSubmit={handleSubmit} noValidate>
            <DialogTitle className="text-lg font-semibold">{talentName}さんのパスワードを設定</DialogTitle>
            <DialogDescription className="mt-1.5 text-sm text-neutral-500">
              タレントがパスワードを忘れたときなどに使います。設定後、本人は初回ログイン時にパスワードの変更を求められます。
            </DialogDescription>

            <label htmlFor="admin-set-pw" className="mt-5 block text-sm font-medium text-neutral-900">
              新しいパスワード
            </label>
            <input
              id="admin-set-pw"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setError("")
              }}
              autoComplete="new-password"
              aria-invalid={Boolean(error) || undefined}
              className={`${FIELD} mt-2 h-11`}
            />
            <p className="mt-1.5 text-xs text-neutral-500">8文字以上</p>

            <label htmlFor="admin-set-pw-confirm" className="mt-4 block text-sm font-medium text-neutral-900">
              確認のため、もう一度入力
            </label>
            <input
              id="admin-set-pw-confirm"
              type="password"
              value={passwordConfirm}
              onChange={(e) => {
                setPasswordConfirm(e.target.value)
                setError("")
              }}
              autoComplete="new-password"
              aria-invalid={Boolean(error) || undefined}
              className={`${FIELD} mt-2 h-11`}
            />

            {error && (
              <p role="alert" className="mt-3 flex items-start gap-1.5 text-sm text-red-600">
                <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                {error}
              </p>
            )}

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" className={BTN_SECONDARY} onClick={handleClose}>
                キャンセル
              </button>
              <button type="submit" className={BTN_PRIMARY} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" aria-hidden="true" />
                    設定中…
                  </>
                ) : (
                  "パスワードを設定"
                )}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
