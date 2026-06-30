"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { deleteAgencyTalent } from "@/lib/actions/agency-talent"
import { deleteAgencyClient } from "@/lib/actions/agency-client"
import { deleteAgencyApplication } from "@/lib/actions/agency-application"
import { deleteAgencyOption } from "@/lib/actions/agency-option"

const deleteActions = {
  talent: deleteAgencyTalent,
  client: deleteAgencyClient,
  application: deleteAgencyApplication,
  option: deleteAgencyOption,
} as const

export function AgencyDeleteButton({
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
      const defaultRedirects: Record<string, string> = {
        talent: "/agency/talents",
        client: "/agency/clients",
        application: "/agency/applications",
        option: "/agency/options",
      }
      router.push(redirectTo ?? defaultRedirects[type] ?? "/agency/dashboard")
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
