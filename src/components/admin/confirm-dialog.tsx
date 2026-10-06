"use client"

import { useCallback, useRef, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { BTN_PRIMARY, BTN_SECONDARY } from "@/components/admin/styles"

const BTN_DANGER =
  "inline-flex h-9 items-center justify-center rounded-lg bg-red-600 px-4 text-sm font-medium text-white transition-colors hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600/30"

type ConfirmOptions = {
  title: string
  description?: React.ReactNode
  confirmLabel?: string
  cancelLabel?: string
  // 削除など取り消せない操作は赤いボタンにする
  danger?: boolean
}

// ブラウザ標準の confirm() の代わり。画面と同じ見た目の小窓で確認し、押された結果を true / false で返す
//   const [confirm, confirmDialog] = useConfirm()
//   if (!(await confirm({ title: "削除しますか？", danger: true }))) return
//   … JSX のどこかに {confirmDialog} を置く
export function useConfirm() {
  const [options, setOptions] = useState<ConfirmOptions | null>(null)
  const resolveRef = useRef<((ok: boolean) => void) | null>(null)

  const confirm = useCallback((opts: ConfirmOptions) => {
    resolveRef.current?.(false)
    setOptions(opts)
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve
    })
  }, [])

  function close(ok: boolean) {
    resolveRef.current?.(ok)
    resolveRef.current = null
    setOptions(null)
  }

  const dialog = (
    <Dialog open={options !== null} onOpenChange={(open) => !open && close(false)}>
      <DialogContent className="gap-0 bg-white p-6 sm:max-w-md">
        <DialogTitle className="text-lg font-semibold">{options?.title}</DialogTitle>
        {options?.description && (
          <DialogDescription className="mt-2 whitespace-pre-line text-sm leading-relaxed text-neutral-600">
            {options.description}
          </DialogDescription>
        )}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" className={BTN_SECONDARY} onClick={() => close(false)}>
            {options?.cancelLabel ?? "やめる"}
          </button>
          <button type="button" className={options?.danger ? BTN_DANGER : BTN_PRIMARY} onClick={() => close(true)}>
            {options?.confirmLabel ?? "OK"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )

  return [confirm, dialog] as const
}
