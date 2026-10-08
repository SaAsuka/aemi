"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useConfirm } from "@/components/admin/confirm-dialog"
import { Button } from "@/components/ui/button"
import { deleteTalent } from "@/lib/actions/talent"
import { deleteClient } from "@/lib/actions/client"
import { deleteJob } from "@/lib/actions/job"
import { deleteApplication } from "@/lib/actions/application"
import { deleteSchedule } from "@/lib/actions/schedule"
import { deleteOption } from "@/lib/actions/option"
import { deleteProductionCompany } from "@/lib/actions/production-company"

const deleteActions = {
  talent: deleteTalent,
  client: deleteClient,
  job: deleteJob,
  application: deleteApplication,
  schedule: deleteSchedule,
  option: deleteOption,
  "production-company": deleteProductionCompany,
} as const

export function DeleteButton({
  id,
  type,
  redirectTo,
  className,
  label = "削除",
  confirmMessage = "本当に削除しますか？",
}: {
  id: string
  type: keyof typeof deleteActions
  redirectTo?: string
  // 以下は画面ごとに見た目・文言を変えたいとき用（未指定なら従来どおり）
  className?: string
  label?: string
  confirmMessage?: string
}) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const [confirm, confirmDialog] = useConfirm()

  async function handleDelete() {
    // 1行目を見出し、2行目以降を説明として小窓に出す
    const [title, ...rest] = confirmMessage.split("\n")
    const ok = await confirm({ title, description: rest.join("\n") || undefined, confirmLabel: "削除する", danger: true })
    if (!ok) return
    startTransition(async () => {
      let result: unknown
      try {
        result = await deleteActions[type](id)
      } catch {
        toast.error("削除できませんでした", {
          description: "関係するデータ（応募・請求書など）が残っている可能性があります。",
        })
        return
      }
      if (result && typeof result === "object" && "error" in result && typeof result.error === "string") {
        toast.error("削除できませんでした", { description: result.error })
        return
      }
      const defaultRedirects: Record<string, string> = {
        "production-company": "/admin/production-companies",
      }
      router.push(redirectTo ?? defaultRedirects[type] ?? `/admin/${type}s`)
    })
  }

  return (
    <>
    <Button
      variant="destructive"
      size="sm"
      onClick={handleDelete}
      disabled={isPending}
      className={className}
    >
      {isPending ? "削除中..." : label}
    </Button>
    {confirmDialog}
    </>
  )
}
