"use client"

import { useState } from "react"
import { Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useCopyWithFallback } from "@/components/admin/copy-fallback"

export function TalentUrlCopy({ accessToken }: { accessToken: string }) {
  const [copied, setCopied] = useState(false)
  const { copy: copyWithFallback, fallback } = useCopyWithFallback()

  const copy = async (e: React.MouseEvent<HTMLElement>) => {
    const url = `${window.location.origin}/jobs?t=${accessToken}`
    if (!(await copyWithFallback(url, e.currentTarget.parentElement))) return
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4 py-3">
        <div className="min-w-0">
          <p className="text-sm font-medium">タレント専用URL</p>
          <p className="text-xs text-muted-foreground truncate">
            /jobs?t={accessToken}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={copy}>
          {copied ? <Check className="h-4 w-4 mr-1 text-green-600" /> : <Copy className="h-4 w-4 mr-1" />}
          {copied ? "コピー済み" : "URLをコピー"}
        </Button>
        {fallback}
      </CardContent>
    </Card>
  )
}
