"use client"

import { useState } from "react"
import { Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { sendLineNotification } from "@/lib/actions/job"

export function LineNotifyButton({ jobId, matchCount }: { jobId: string; matchCount: number }) {
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  const handleSend = async () => {
    if (!confirm(`該当タレント${matchCount}名にLINE通知を送信しますか？`)) return
    setSending(true)
    setResult(null)
    const res = await sendLineNotification(jobId)
    setSending(false)
    if (res.success) {
      setResult(`${res.sentCount}名に送信しました`)
    } else {
      setResult(res.error ?? "送信に失敗しました")
    }
  }

  return (
    <div className="flex items-center gap-3">
      <Button onClick={handleSend} disabled={sending || matchCount === 0} size="sm">
        <Send className="h-4 w-4 mr-1" />
        {sending ? "送信中..." : "LINE通知送信"}
      </Button>
      {result && <span className="text-sm text-muted-foreground">{result}</span>}
    </div>
  )
}
