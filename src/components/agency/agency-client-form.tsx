"use client"

import { useActionState } from "react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { createAgencyClient, updateAgencyClient } from "@/lib/actions/agency-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { Client } from "@/generated/prisma/client"

type ActionResult = { success?: boolean; error?: Record<string, string[]> } | null

function agencyClientAction(client?: Client) {
  return async (_prev: ActionResult, formData: FormData): Promise<ActionResult> => {
    if (client) return await updateAgencyClient(client.id, formData)
    return await createAgencyClient(formData)
  }
}

export function AgencyClientForm({ client, onSuccess }: { client?: Client; onSuccess?: () => void }) {
  const [state, action, isPending] = useActionState(agencyClientAction(client), null)
  const router = useRouter()

  useEffect(() => {
    if (state?.success && !client) {
      router.push("/agency/clients")
    }
    if (state?.success) {
      onSuccess?.()
    }
  }, [state, client, router, onSuccess])

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="companyName">会社名 *</Label>
        <Input id="companyName" name="companyName" defaultValue={client?.companyName ?? ""} required />
        {state?.error?.companyName && <p className="text-sm text-destructive">{state.error.companyName[0]}</p>}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="contactName">担当者名</Label>
          <Input id="contactName" name="contactName" defaultValue={client?.contactName ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contactEmail">担当者メール</Label>
          <Input id="contactEmail" name="contactEmail" type="email" defaultValue={client?.contactEmail ?? ""} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="contactPhone">電話番号</Label>
          <Input id="contactPhone" name="contactPhone" defaultValue={client?.contactPhone ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lineGroupId">LINEグループID</Label>
          <Input id="lineGroupId" name="lineGroupId" defaultValue={client?.lineGroupId ?? ""} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="note">備考</Label>
        <Textarea id="note" name="note" defaultValue={client?.note ?? ""} />
      </div>

      {state?.success && client && <p className="text-sm text-green-600">更新しました</p>}

      <Button type="submit" disabled={isPending}>
        {isPending ? "保存中..." : client ? "更新" : "登録"}
      </Button>
    </form>
  )
}
