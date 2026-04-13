"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { deleteApplication } from "@/lib/actions/application"
import { Button } from "@/components/ui/button"

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
    <Button
      variant="outline"
      size="xs"
      onClick={handleDelete}
      disabled={isPending}
      className="text-destructive hover:text-destructive"
    >
      {isPending ? "削除中..." : "削除"}
    </Button>
  )
}
