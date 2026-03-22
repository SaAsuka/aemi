"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function TalentDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[TalentDetail]", error)
  }, [error])

  return (
    <div className="max-w-2xl mx-auto py-12 text-center space-y-4">
      <h2 className="text-xl font-bold">エラーが発生しました</h2>
      <p className="text-muted-foreground text-sm">
        {error.message || "不明なエラー"}
      </p>
      {error.digest && (
        <p className="text-xs text-muted-foreground">Digest: {error.digest}</p>
      )}
      <Button onClick={reset}>再試行</Button>
    </div>
  )
}
