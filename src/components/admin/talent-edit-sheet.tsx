"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Pencil } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { TalentForm } from "@/components/admin/talent-form"
import { BTN_PRIMARY } from "@/components/admin/styles"
import type { Talent } from "@/generated/prisma/client"

export function TalentEditSheet({ talent, className = BTN_PRIMARY }: { talent: Talent; className?: string }) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}>
        <Pencil aria-hidden="true" />
        編集
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85dvh] gap-0 overflow-y-auto bg-white p-6 sm:max-w-2xl">
          <DialogTitle className="text-lg font-semibold">{talent.name}さんの情報を編集</DialogTitle>
          <DialogDescription className="mt-1 mb-5 text-sm text-neutral-500">
            変更したい項目を書き換えて、いちばん下の「更新」を押してください。
          </DialogDescription>
          <TalentForm
            talent={talent}
            onSuccess={() => {
              setOpen(false)
              toast.success("タレント情報を更新しました")
              router.refresh()
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
