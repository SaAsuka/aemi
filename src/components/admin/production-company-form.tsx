"use client"

import { useActionState } from "react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { createProductionCompany, updateProductionCompany } from "@/lib/actions/production-company"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { ProductionCompany } from "@/generated/prisma/client"

type ActionResult = { success?: boolean; error?: Record<string, string[]> } | null

function companyAction(company?: ProductionCompany) {
  return async (_prev: ActionResult, formData: FormData): Promise<ActionResult> => {
    if (company) {
      return await updateProductionCompany(company.id, formData)
    }
    return await createProductionCompany(formData)
  }
}

export function ProductionCompanyForm({ company }: { company?: ProductionCompany }) {
  const [state, action, isPending] = useActionState(companyAction(company), null)
  const router = useRouter()

  useEffect(() => {
    if (state?.success && !company) {
      router.push("/admin/production-companies")
    }
  }, [state, company, router])

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="companyName">会社名 *</Label>
        <Input
          id="companyName"
          name="companyName"
          defaultValue={company?.companyName ?? ""}
          required
        />
        {state?.error?.companyName && (
          <p className="text-sm text-destructive">{state.error.companyName[0]}</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="zipCode">郵便番号</Label>
          <Input
            id="zipCode"
            name="zipCode"
            placeholder="000-0000"
            defaultValue={company?.zipCode ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contactPhone">電話番号</Label>
          <Input
            id="contactPhone"
            name="contactPhone"
            defaultValue={company?.contactPhone ?? ""}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">住所</Label>
        <Input
          id="address"
          name="address"
          defaultValue={company?.address ?? ""}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="contactName">担当者名</Label>
          <Input
            id="contactName"
            name="contactName"
            defaultValue={company?.contactName ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contactEmail">担当者メール</Label>
          <Input
            id="contactEmail"
            name="contactEmail"
            type="email"
            defaultValue={company?.contactEmail ?? ""}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="note">備考</Label>
        <Textarea id="note" name="note" defaultValue={company?.note ?? ""} />
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? "保存中..." : company ? "更新" : "登録"}
      </Button>
    </form>
  )
}
