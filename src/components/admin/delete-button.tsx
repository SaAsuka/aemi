"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
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

  function handleDelete() {
    if (!confirm(confirmMessage)) return
    startTransition(async () => {
      const result = await deleteActions[type](id)
      if (result && "error" in result && typeof result.error === "string") {
        alert(result.error)
        return
      }
      const defaultRedirects: Record<string, string> = {
        "production-company": "/admin/production-companies",
      }
      router.push(redirectTo ?? defaultRedirects[type] ?? `/admin/${type}s`)
    })
  }

  return (
    <Button
      variant="destructive"
      size="sm"
      onClick={handleDelete}
      disabled={isPending}
      className={className}
    >
      {isPending ? "削除中..." : label}
    </Button>
  )
}
