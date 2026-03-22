"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { TalentForm } from "@/components/admin/talent-form"
import { updateMyProfile } from "@/lib/actions/talent-mypage"
import { Pencil } from "lucide-react"
import type { Talent } from "@/generated/prisma/client"

export function TalentEditSheet({ talent }: { talent: Talent }) {
  const [open, setOpen] = useState(false)

  async function handleAction(formData: FormData) {
    return await updateMyProfile(formData)
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button variant="outline" size="sm" />}>
        <Pencil className="h-4 w-4 mr-1" />
        プロフィール編集
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>プロフィール編集</SheetTitle>
        </SheetHeader>
        <div className="px-4 pb-4">
          <TalentForm
            talent={talent}
            mode="talent"
            customAction={handleAction}
            onSuccess={() => setOpen(false)}
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}
