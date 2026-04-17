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

const deleteActions = {
  talent: deleteTalent,
  client: deleteClient,
  job: deleteJob,
  application: deleteApplication,
  schedule: deleteSchedule,
  option: deleteOption,
} as const

export function DeleteButton({
  id,
  type,
  redirectTo,
}: {
  id: string
  type: keyof typeof deleteActions
  redirectTo?: string
}) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleDelete() {
    if (!confirm("本当に削除しますか？")) return
    startTransition(async () => {
      const result = await deleteActions[type](id)
      if (result && "error" in result && typeof result.error === "string") {
        alert(result.error)
        return
      }
      router.push(redirectTo ?? `/admin/${type}s`)
    })
  }

  return (
    <Button
      variant="destructive"
      size="sm"
      onClick={handleDelete}
      disabled={isPending}
    >
      {isPending ? "削除中..." : "削除"}
    </Button>
  )
}
