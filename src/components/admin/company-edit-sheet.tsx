"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useConfirm } from "@/components/admin/confirm-dialog"
import { Pencil } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { CompanyEditorForm } from "@/components/admin/company-editor-form"
import { BTN_PRIMARY } from "@/components/admin/styles"
import type { ProductionCompany } from "@/generated/prisma/client"

const UNSAVED_MESSAGE = "変更した内容はまだ保存されていません。閉じると、変更は消えます。"

// 制作会社詳細の「編集」。押すと小窓で会社の情報を編集する
export function CompanyEditSheet({
  company,
  className = BTN_PRIMARY,
}: {
  company: ProductionCompany
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const [dirty, setDirty] = useState(false)
  const router = useRouter()

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
        <DialogContent className="max-h-[90dvh] gap-0 overflow-y-auto bg-white p-6 sm:max-w-2xl">
          <DialogTitle className="text-lg font-semibold">制作会社を編集</DialogTitle>
          <DialogDescription className="mt-1 mb-6 text-sm text-neutral-500">
            変更したい項目を書き換えて、下の「保存する」を押してください。
          </DialogDescription>
          <CompanyEditorForm
            company={company}
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
