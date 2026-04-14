"use client"

import { useSearchParams } from "next/navigation"
import { MessageCircle, Check, ExternalLink, Bell, BellOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { disconnectLine, updateLineNotifySetting } from "@/lib/actions/line"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export function LineConnectSection({
  connected,
  notifyEnabled = true,
}: {
  connected: boolean
  notifyEnabled?: boolean
}) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [toast, setToast] = useState<string | null>(null)
  const [notify, setNotify] = useState(notifyEnabled)
  const [toggling, setToggling] = useState(false)

  useEffect(() => {
    const lineStatus = searchParams.get("line")
    if (lineStatus === "connected") {
      setToast("LINE連携が完了しました")
      router.replace("/mypage/settings", { scroll: false })
    } else if (lineStatus === "error") {
      setToast("LINE連携に失敗しました。もう一度お試しください")
      router.replace("/mypage/settings", { scroll: false })
    }
  }, [searchParams, router])

  const handleToggleNotify = async () => {
    setToggling(true)
    const newValue = !notify
    setNotify(newValue)
    await updateLineNotifySetting(newValue)
    setToggling(false)
  }

  if (connected) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-5 space-y-4">
        {toast && (
          <div className="rounded-md bg-green-100 px-3 py-2 text-sm text-green-800">
            {toast}
          </div>
        )}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500">
            <Check className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-medium text-green-800">LINE連携済み</p>
            <p className="text-sm text-green-600">新しい案件が登録されるとLINEで通知が届きます</p>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-md border border-green-200 bg-white p-3">
          <div className="flex items-center gap-2">
            {notify ? <Bell className="h-4 w-4 text-green-600" /> : <BellOff className="h-4 w-4 text-muted-foreground" />}
            <span className="text-sm">LINE通知</span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={notify}
            disabled={toggling}
            onClick={handleToggleNotify}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors disabled:opacity-50 ${
              notify ? "bg-green-500" : "bg-gray-200"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform ${
                notify ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="text-green-700 hover:text-red-600"
          onClick={async () => {
            if (!confirm("LINE連携を解除しますか？案件の通知が届かなくなります。")) return
            await disconnectLine()
            router.refresh()
          }}
        >
          連携を解除する
        </Button>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-dashed border-gray-300 p-5">
      {toast && (
        <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">
          {toast}
        </div>
      )}
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
        <a href="/api/line/auth">
          <Button className="bg-[#06C755] hover:bg-[#05b04c] text-white">
            <ExternalLink className="h-4 w-4 mr-2" />
            LINEで連携する
          </Button>
        </a>
      </div>
    </div>
  )
}
