"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Link2, Check } from "lucide-react"

export function RegisterLinkCopy() {
  const [copied, setCopied] = useState(false)

  const copy = () => {
    const url = `${window.location.origin}/register`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Button onClick={copy} variant="outline" size="sm">
      {copied ? <Check className="h-4 w-4 mr-1" /> : <Link2 className="h-4 w-4 mr-1" />}
      {copied ? "コピー済み" : "登録フォームURL"}
    </Button>
  )
}
