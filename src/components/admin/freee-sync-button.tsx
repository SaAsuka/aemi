"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { RefreshCw } from "lucide-react"
import { syncFreeePartners } from "@/lib/actions/production-company"
import { BTN_SECONDARY } from "@/components/admin/styles"

// freee の取引先のうち、まだ登録されていない会社を制作会社として取り込む
export function FreeeSyncButton({
  connected,
  className = BTN_SECONDARY,
}: {
  // freee と連携しているか（していなければ、押したときに設定ページへ案内する）
  connected: boolean
  className?: string
}) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleSync() {
    if (!connected) {
      toast.error("freeeとまだ連携していません", {
        description: "設定ページでfreeeと連携すると、取引先を取り込めるようになります。",
        action: { label: "設定を開く", onClick: () => router.push("/admin/settings") },
      })
      return
    }
    startTransition(async () => {
      const result = await syncFreeePartners()
      if (result.error) {
        toast.error("freeeから取り込めませんでした", {
          description: result.error.includes("未連携")
            ? "freeeとの連携が切れています。設定ページで連携し直してください。"
            : "少し時間をおいて、もう一度お試しください。",
        })
        return
      }
      if (result.created > 0) {
        toast.success(`freeeから${result.created}社を取り込みました`, {
          description: `freeeの取引先 ${result.synced}社のうち、まだ登録されていなかった会社を追加しました。`,
        })
        router.refresh()
      } else {
        toast.success("新しく取り込む会社はありませんでした", {
          description: `freeeの取引先 ${result.synced}社は、すべて登録済みです。`,
        })
      }
    })
  }

  return (
    <button
      type="button"
      onClick={handleSync}
      disabled={isPending}
      title="freeeの取引先のうち、まだ登録されていない会社を追加します"
      className={className}
    >
      <RefreshCw className={isPending ? "animate-spin" : undefined} aria-hidden="true" />
      {isPending ? "取り込み中…" : "freeeから取り込む"}
    </button>
  )
}
