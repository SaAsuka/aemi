"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { AgencyTalentForm } from "@/components/agency/agency-talent-form"
import type { Talent } from "@/generated/prisma/client"

export function AgencyTalentEditSheet({ talent }: { talent: Omit<Talent, "accessToken"> }) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <Pencil className="h-4 w-4" />
        編集
      </DialogTrigger>
      <DialogContent className="overflow-y-auto max-h-[85vh] sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>基本情報 編集</DialogTitle>
        </DialogHeader>
        <AgencyTalentForm
          talent={talent}
          onSuccess={() => {
            setOpen(false)
            router.refresh()
          }}
        />
      </DialogContent>
    </Dialog>
  )
}
