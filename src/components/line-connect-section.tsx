"use client"

import { useState } from "react"
import { MessageCircle, Check, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"

export function LineConnectSection({ connected }: { connected: boolean }) {
  const [isConnected, setIsConnected] = useState(connected)

  if (isConnected) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500">
            <Check className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-medium text-green-800">LINE連携済み</p>
            <p className="text-sm text-green-600">新しい案件が登録されるとLINEで通知が届きます</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="mt-3 text-green-700 hover:text-red-600"
          onClick={() => {
            if (confirm("LINE連携を解除しますか？案件の通知が届かなくなります。")) {
              setIsConnected(false)
            }
          }}
        >
          連携を解除する
        </Button>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-dashed border-gray-300 p-5">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#06C755]">
          <MessageCircle className="h-7 w-7 text-white" />
        </div>
        <div>
          <p className="font-medium">LINEと連携して案件通知を受け取る</p>
          <p className="mt-1 text-sm text-muted-foreground">
            連携すると、あなたに合った新しい案件が登録されたときにLINEで通知が届きます
          </p>
        </div>
        <Button
          className="bg-[#06C755] hover:bg-[#05b04c] text-white"
          onClick={() => {
            alert("LINEログイン画面に遷移します（未実装）")
          }}
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          LINEで連携する
        </Button>
      </div>
    </div>
  )
}
