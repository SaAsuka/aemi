"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useConfirm } from "@/components/admin/confirm-dialog"
import { Pencil } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { TalentEditorForm, type TalentWithRelations } from "@/components/admin/talent-editor-form"
import { BTN_PRIMARY } from "@/components/admin/styles"

const UNSAVED_MESSAGE = "変更した内容はまだ保存されていません。閉じると、変更は消えます。"

export function TalentEditSheet({
  talent,
  className = BTN_PRIMARY,
}: {
  talent: TalentWithRelations
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const [dirty, setDirty] = useState(false)
  const router = useRouter()

  // 書き換えた内容があるのに閉じようとしたら、確認してから閉じる
  const [confirm, confirmDialog] = useConfirm()

  async function requestClose() {
    if (dirty && !(await confirm({ title: "保存せずに閉じますか？", description: UNSAVED_MESSAGE, confirmLabel: "保存せずに閉じる", cancelLabel: "編集に戻る" }))) return
    setOpen(false)
    setDirty(false)
  }

  return (
    <>
      <button
        type="button"
        className={className}
        onClick={() => {
          setDirty(false)
          setOpen(true)
        }}
      >
        <Pencil aria-hidden="true" />
        編集
      </button>
      <Dialog open={open} onOpenChange={(next) => (next ? setOpen(true) : requestClose())}>
        <DialogContent className="max-h-[90dvh] gap-0 overflow-y-auto bg-white p-6 sm:max-w-3xl">
          <DialogTitle className="text-lg font-semibold">{talent.name}さんの情報を編集</DialogTitle>
          <DialogDescription className="mt-1 mb-6 text-sm text-neutral-500">
            変更したい項目を書き換えて、下の「保存する」を押してください。
          </DialogDescription>
          <TalentEditorForm
            talent={talent}
            inDialog
            onDirtyChange={setDirty}
            onCancel={requestClose}
            onSuccess={() => {
              setDirty(false)
              setOpen(false)
              router.refresh()
            }}
          />
        </DialogContent>
      </Dialog>
      {confirmDialog}
    </>
  )
}
