"use client"

import { useActionState } from "react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { createClient, updateClient } from "@/lib/actions/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { Client } from "@/generated/prisma/client"

type ActionResult = { success?: boolean; error?: Record<string, string[]> } | null

function clientAction(client?: Client) {
  return async (_prev: ActionResult, formData: FormData): Promise<ActionResult> => {
    if (client) {
      return await updateClient(client.id, formData)
    }
    return await createClient(formData)
  }
}

export function ClientForm({ client }: { client?: Client }) {
  const [state, action, isPending] = useActionState(clientAction(client), null)
  const router = useRouter()

  useEffect(() => {
    if (state?.success && !client) {
      router.push("/admin/clients")
    }
  }, [state, client, router])

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="companyName">会社名 *</Label>
        <Input
          id="companyName"
          name="companyName"
          defaultValue={client?.companyName ?? ""}
          required
        />
        {state?.error?.companyName && (
          <p className="text-sm text-destructive">{state.error.companyName[0]}</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="contactName">担当者名</Label>
          <Input
            id="contactName"
            name="contactName"
            defaultValue={client?.contactName ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contactEmail">担当者メール</Label>
          <Input
            id="contactEmail"
            name="contactEmail"
            type="email"
            defaultValue={client?.contactEmail ?? ""}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="contactPhone">電話番号</Label>
          <Input
            id="contactPhone"
            name="contactPhone"
            defaultValue={client?.contactPhone ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lineGroupId">LINEグループID</Label>
          <Input
            id="lineGroupId"
            name="lineGroupId"
            defaultValue={client?.lineGroupId ?? ""}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="note">備考</Label>
        <Textarea id="note" name="note" defaultValue={client?.note ?? ""} />
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? "保存中..." : client ? "更新" : "登録"}
      </Button>
    </form>
  )
}
