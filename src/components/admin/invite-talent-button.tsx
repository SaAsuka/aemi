"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { inviteTalent } from "@/lib/actions/auth"

export function InviteTalentButton({ email }: { email?: string | null }) {
  const [inputEmail, setInputEmail] = useState(email || "")
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle")
  const [error, setError] = useState("")
  const [showInput, setShowInput] = useState(false)

  async function handleInvite() {
    if (!inputEmail.trim()) return
    setStatus("loading")
    setError("")
    const result = await inviteTalent(inputEmail.trim())
    if (result.error) {
      setError(result.error)
      setStatus("error")
    } else {
      setStatus("sent")
    }
  }

  if (status === "sent") {
    return <span className="text-sm text-green-600">招待メール送信済み</span>
  }

  if (!showInput && !email) {
    return (
      <Button variant="outline" size="sm" onClick={() => setShowInput(true)}>
        招待メール送信
      </Button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      {!email && (
        <input
          type="email"
          value={inputEmail}
          onChange={(e) => setInputEmail(e.target.value)}
          placeholder="メールアドレス"
          className="h-8 rounded-md border px-2 text-sm w-48"
        />
      )}
      <Button
        variant="outline"
        size="sm"
        onClick={handleInvite}
        disabled={status === "loading" || !inputEmail.trim()}
      >
        {status === "loading" ? "送信中..." : "招待メール送信"}
      </Button>
      {error && <span className="text-sm text-red-600">{error}</span>}
    </div>
  )
}
