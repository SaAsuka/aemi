"use client"

import { useState } from "react"
import { Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCopyWithFallback } from "@/components/admin/copy-fallback"

export function JobLinkCopyButton({ accessToken }: { accessToken: string }) {
  const [copied, setCopied] = useState(false)
  const { copy: copyWithFallback, fallback } = useCopyWithFallback()

  const copy = async (e: React.MouseEvent<HTMLElement>) => {
    const url = `${window.location.origin}/jobs?t=${accessToken}`
    if (!(await copyWithFallback(url, e.currentTarget.parentElement))) return
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <Button variant="ghost" size="sm" onClick={copy} className="h-7 px-2">
        {copied ? (
          <Check className="h-3.5 w-3.5 text-green-600" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
      </Button>
      {fallback}
    </>
  )
}
