"use client"

import { useRef, useState } from "react"
import { AlertCircle, CheckCircle2, Loader2, Mail } from "lucide-react"
import { inviteTalent } from "@/lib/actions/auth"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { BTN_PRIMARY, BTN_SECONDARY, FIELD } from "@/components/admin/styles"

// ボタンを押すと、メールアドレスを入れて招待メールを送る小窓が開く
export function InviteTalentButton({
  email,
  className = BTN_SECONDARY,
}: {
  email?: string | null
  className?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [inputEmail, setInputEmail] = useState(email || "")
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle")
  const [error, setError] = useState("")
  const [sentTo, setSentTo] = useState("")

  function reset() {
    setInputEmail(email || "")
    setStatus("idle")
    setError("")
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    const value = inputEmail.trim()
    if (!value) {
      setError("メールアドレスを入力してください")
      setStatus("error")
      inputRef.current?.focus()
      return
    }
    setStatus("loading")
    setError("")
    const result = await inviteTalent(value)
    if (result.error) {
      setError(result.error)
      setStatus("error")
      inputRef.current?.focus()
    } else {
      setSentTo(value)
      setStatus("sent")
    }
  }

  return (
    <>
      <button
        type="button"
        className={className}
        onClick={() => {
          reset()
          setOpen(true)
        }}
      >
        <Mail aria-hidden="true" />
        招待メール送信
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="gap-0 bg-white p-6 sm:max-w-md">
          {status === "sent" ? (
            <div className="text-center">
              <CheckCircle2 className="mx-auto size-10 text-green-600" aria-hidden="true" />
              <DialogTitle className="mt-4 text-lg font-semibold">招待メールを送信しました</DialogTitle>
              <DialogDescription className="mt-2 break-all text-sm text-neutral-500">
                {sentTo} 宛に送信しました。
                <br />
                タレントがメールのリンクから登録を進めます。
              </DialogDescription>
              <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-center">
                <button
                  type="button"
                  className={BTN_SECONDARY}
                  onClick={() => {
                    reset()
                    requestAnimationFrame(() => inputRef.current?.focus())
                  }}
                >
                  続けて招待する
                </button>
                <button type="button" className={BTN_PRIMARY} onClick={() => setOpen(false)}>
                  閉じる
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleInvite} noValidate>
              <DialogTitle className="text-lg font-semibold">招待メールを送信</DialogTitle>
              <DialogDescription className="mt-1.5 text-sm text-neutral-500">
                入力したメールアドレスに、登録用のリンクを送ります。
              </DialogDescription>

              <label htmlFor="invite-email" className="mt-5 block text-sm font-medium text-neutral-900">
                メールアドレス
              </label>
              <input
                ref={inputRef}
                id="invite-email"
                type="email"
                inputMode="email"
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                value={inputEmail}
                onChange={(e) => {
                  setInputEmail(e.target.value)
                  if (status === "error") {
                    setStatus("idle")
                    setError("")
                  }
                }}
                placeholder="example@mail.com"
                aria-invalid={status === "error"}
                aria-describedby={status === "error" ? "invite-email-error" : undefined}
                readOnly={status === "loading"}
                className={`${FIELD} mt-2 h-11 text-base ${
                  status === "error" ? "border-red-600 focus-visible:border-red-600 focus-visible:ring-red-600/15" : ""
                }`}
              />
              {status === "error" && (
                <p id="invite-email-error" role="alert" className="mt-2 flex items-start gap-1.5 text-sm text-red-600">
                  <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  {error}
                </p>
              )}

              <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button type="button" className={BTN_SECONDARY} onClick={() => setOpen(false)}>
                  キャンセル
                </button>
                <button type="submit" className={BTN_PRIMARY} disabled={status === "loading"}>
                  {status === "loading" ? (
                    <>
                      <Loader2 className="animate-spin" aria-hidden="true" />
                      送信中…
                    </>
                  ) : (
                    "送信する"
                  )}
                </button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
