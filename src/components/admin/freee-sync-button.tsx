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
          description: result.error.includes("連携していません")
            ? "freeeとの連携が切れています。設定ページで連携し直してください。"
            : "少し時間をおいて、もう一度お試しください。",
        })
        return
      }
      const linked = result.linked ?? 0
      if (result.created > 0 || linked > 0) {
        toast.success(
          result.created > 0 ? `freeeから${result.created}社を取り込みました` : `${linked}社をfreeeの取引先と結び付けました`,
          {
            description: [
              result.created > 0 ? `まだ登録されていなかった${result.created}社を追加しました。` : null,
              linked > 0 ? `同じ名前ですでに登録されていた${linked}社は、新しく作らずにfreeeと結び付けました。` : null,
            ]
              .filter(Boolean)
              .join(""),
          }
        )
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
