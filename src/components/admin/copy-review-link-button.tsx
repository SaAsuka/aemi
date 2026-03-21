"use client"

import { useState, useTransition } from "react"
import { generateReviewLink } from "@/lib/actions/review"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export function CopyReviewLinkButton({
  applicationId,
  currentStatus,
}: {
  applicationId: string
  currentStatus: string
}) {
  const [isPending, startTransition] = useTransition()
  const [copied, setCopied] = useState(false)

  const disabled = !["APPLIED", "RESUME_SENT"].includes(currentStatus)

  function handleClick() {
    startTransition(async () => {
      const res = await generateReviewLink(applicationId)
      if (res.error) {
        toast.error(res.error)
        return
      }

      const baseUrl = window.location.origin
      const text = `${res.talentName}さんのプロフィールです。\nご確認の上、合否のご判断をお願いいたします🙇\n\n📋 案件: ${res.jobTitle}\n\n👇タレント情報・合否回答はこちら\n${baseUrl}/review/${res.token}`

      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast.success("コピーしました")
      setTimeout(() => setCopied(false), 2000)
    })
  }

  if (disabled) return null

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={isPending}
      className="whitespace-nowrap"
    >
      {isPending ? "生成中..." : copied ? "コピー済み" : "送信用コピー"}
    </Button>
  )
}
