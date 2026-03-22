"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <Pencil className="h-4 w-4 mr-1" />
        プロフィール編集
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>プロフィール編集</DialogTitle>
        </DialogHeader>
        <TalentForm
          talent={talent}
          mode="talent"
          customAction={handleAction}
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
