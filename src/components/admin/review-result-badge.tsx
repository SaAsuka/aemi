"use client"

import { useState } from "react"
import { REJECTION_REASONS } from "@/types"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type ReviewData = {
  status: string
  reviewedAt: Date | null
  preferredDate: string | null
  preferredTime: string | null
  reviewComment: string | null
  rejectionReason: string | null
  talentName: string
  jobTitle: string
}

export function ReviewResultBadge({ data }: { data: ReviewData }) {
  const [open, setOpen] = useState(false)

  if (!data.reviewedAt) return null

  const isAccepted = data.status === "ACCEPTED"

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium cursor-pointer ${
          isAccepted
            ? "bg-green-100 text-green-800 hover:bg-green-200"
            : "bg-red-100 text-red-800 hover:bg-red-200"
        }`}
      >
        {isAccepted ? "⭕ 合格" : "❌ 不合格"}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>クライアント回答</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {data.talentName} / {data.jobTitle}
            </p>

            <div className="rounded-lg border p-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">結果</span>
                <span className="font-medium">{isAccepted ? "合格" : "不合格"}</span>
              </div>

              {isAccepted && data.preferredDate && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">希望日</span>
                  <span className="font-medium">{data.preferredDate}</span>
                </div>
              )}

              {isAccepted && data.preferredTime && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">希望時間帯</span>
                  <span className="font-medium">{data.preferredTime}</span>
                </div>
              )}

              {!isAccepted && data.rejectionReason && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">不合格理由</span>
                  <span className="font-medium">
                    {REJECTION_REASONS[data.rejectionReason] ?? data.rejectionReason}
                  </span>
                </div>
              )}

              {data.reviewComment && (
                <div className="text-sm">
                  <span className="text-muted-foreground">コメント</span>
                  <p className="mt-1 whitespace-pre-wrap">{data.reviewComment}</p>
                </div>
              )}

              {data.reviewedAt && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">回答日時</span>
                  <span className="font-medium">
                    {new Date(data.reviewedAt).toLocaleString("ja-JP")}
                  </span>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
