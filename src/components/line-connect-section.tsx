"use client"

import { useSearchParams } from "next/navigation"
import { MessageCircle, Check, ExternalLink, Bell, BellOff } from "lucide-react"
import { BTN_LINE } from "@/components/talent/styles"
import { updateLineNotifySetting } from "@/lib/actions/line"
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
      <div className="space-y-4">
        {toast && (
          <div role="status" className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            {toast}
          </div>
        )}
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#06C755]">
            <Check className="size-5 text-white" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-neutral-950">LINE連携済み</p>
            <p className="text-sm text-neutral-500">新しい案件が登録されるとLINEで通知が届きます</p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 rounded-lg border border-neutral-200 px-4 py-3">
          <div className="flex items-center gap-2">
            {notify ? <Bell className="size-4 text-neutral-950" aria-hidden="true" /> : <BellOff className="size-4 text-neutral-400" aria-hidden="true" />}
            <span id="line-notify-label" className="text-sm text-neutral-900">LINE通知</span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={notify}
            aria-labelledby="line-notify-label"
            disabled={toggling}
            onClick={handleToggleNotify}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950/30 focus-visible:ring-offset-2 disabled:opacity-50 ${
              notify ? "bg-neutral-950" : "bg-neutral-200"
            }`}
          >
            <span
              className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow transition-transform ${
                notify ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {toast && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {toast}
        </div>
      )}
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#06C755]">
          <MessageCircle className="size-5 text-white" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="font-medium text-neutral-950">LINEと連携して案件通知を受け取る</p>
          <p className="mt-0.5 text-sm leading-relaxed text-neutral-500">
            連携すると、あなたに合った新しい案件が登録されたときにLINEで通知が届きます
          </p>
        </div>
      </div>
      <a href="/api/line/auth" className={`${BTN_LINE} w-full sm:w-auto`}>
        <ExternalLink aria-hidden="true" />
        LINEで連携する
      </a>
    </div>
  )
}
