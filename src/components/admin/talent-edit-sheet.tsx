"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { TalentForm } from "@/components/admin/talent-form"
import type { Talent } from "@/generated/prisma/client"

export function TalentEditSheet({ talent }: { talent: Talent }) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={<Button variant="outline" size="sm" />}
      >
        <Pencil className="h-4 w-4" />
        編集
      </SheetTrigger>
      <SheetContent className="overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>基本情報 編集</SheetTitle>
        </SheetHeader>
        <TalentForm
          talent={talent}
          onSuccess={() => {
            setOpen(false)
            router.refresh()
          }}
        />
      </SheetContent>
    </Sheet>
  )
}
