"use client"

import { useState, useTransition } from "react"
import { submitReview } from "@/lib/actions/review"
import { REJECTION_REASONS } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function ReviewForm({ token }: { token: string }) {
  const [result, setResult] = useState<"ACCEPTED" | "REJECTED" | null>(null)
  const [rejectionReason, setRejectionReason] = useState("")
  const [isPending, startTransition] = useTransition()
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(formData: FormData) {
    setError(null)
    formData.set("result", result!)
    if (result === "REJECTED") {
      formData.set("rejectionReason", rejectionReason)
    }
    startTransition(async () => {
      const res = await submitReview(token, formData)
      if (res.error) {
        setError(typeof res.error === "string" ? res.error : "入力内容を確認してください")
        return
      }
      setSubmitted(true)
    })
  }

  if (submitted) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">✅</div>
        <h3 className="text-lg font-bold mb-2">ご回答ありがとうございました</h3>
        <p className="text-sm text-muted-foreground">回答が送信されました。</p>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="space-y-4">
        <h3 className="text-base font-semibold text-center">合否のご判断をお願いします</h3>
        <div className="grid grid-cols-2 gap-3">
          <Button
            size="lg"
            className="h-16 text-base"
            onClick={() => setResult("ACCEPTED")}
          >
            ⭕ 合格
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-16 text-base"
            onClick={() => setResult("REJECTED")}
          >
            ❌ 不合格
          </Button>
        </div>
      </div>
    )
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">
          {result === "ACCEPTED" ? "⭕ 合格" : "❌ 不合格"}
        </h3>
        <Button type="button" variant="ghost" size="sm" onClick={() => setResult(null)}>
          戻る
        </Button>
      </div>

      {result === "ACCEPTED" ? (
        <>
          <div className="space-y-2">
            <Label>希望日 *</Label>
            <Input name="preferredDate" type="date" required />
          </div>
          <div className="space-y-2">
            <Label>希望時間帯 *</Label>
            <Input name="preferredTime" type="text" placeholder="例: 10:00〜12:00" required />
          </div>
        </>
      ) : (
        <div className="space-y-2">
          <Label>不合格理由 *</Label>
          <Select value={rejectionReason} onValueChange={(v) => setRejectionReason(v ?? "")}>
            <SelectTrigger>
              <SelectValue placeholder="理由を選択" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(REJECTION_REASONS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <Label>コメント</Label>
        <Textarea name="comment" placeholder="ご自由にご記入ください" rows={3} />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" className="w-full h-12 text-base" disabled={isPending}>
        {isPending ? "送信中..." : "回答を送信"}
      </Button>
    </form>
  )
}
