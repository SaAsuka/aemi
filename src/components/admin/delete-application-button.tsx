"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { deleteApplication } from "@/lib/actions/application"
import { Trash2 } from "lucide-react"

export function DeleteApplicationButton({ applicationId }: { applicationId: string }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleDelete() {
    if (!confirm("この応募を削除しますか？")) return
    startTransition(async () => {
      await deleteApplication(applicationId)
      router.refresh()
    })
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isPending}
      className="text-muted-foreground hover:text-red-500 transition-colors disabled:opacity-50"
      title="削除"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  )
}
