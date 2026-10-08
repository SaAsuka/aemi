"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Link2, Loader2 } from "lucide-react"
import { linkProductionCompanyToFreee } from "@/lib/actions/production-company"
import { BTN_PRIMARY } from "@/components/admin/styles"

// freeeと連携する前に登録した制作会社を、freeeの取引先と結び付ける
export function FreeeLinkButton({ companyId, className = BTN_PRIMARY }: { companyId: string; className?: string }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleClick() {
    startTransition(async () => {
      const res = await linkProductionCompanyToFreee(companyId)
      if ("error" in res && res.error) {
        toast.error("freeeと結び付けられませんでした", { description: res.error })
        return
      }
      toast.success("freeeの取引先と結び付けました", { description: "この会社あての請求書を発行できるようになりました。" })
      router.refresh()
    })
  }

  return (
    <button type="button" onClick={handleClick} disabled={isPending} className={className}>
      {isPending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Link2 aria-hidden="true" />}
      {isPending ? "結び付けています…" : "freeeと結び付ける"}
    </button>
  )
}
