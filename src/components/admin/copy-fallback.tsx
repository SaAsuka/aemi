"use client"

import { useState } from "react"
import { AlertCircle } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { BTN_PRIMARY } from "@/components/admin/styles"
import { copyText } from "@/lib/utils/clipboard"

// コピーボタン用。自動でコピーできなかったときは、文字を小窓に出して長押しでコピーしてもらう
//   const { copy, fallback } = useCopyWithFallback()
//   const ok = await copy("コピーしたい文字", e.currentTarget)
//   return <>{ボタン}{fallback}</>
export function useCopyWithFallback() {
  const [fallbackText, setFallbackText] = useState<string | null>(null)

  const copy = async (text: string, container?: HTMLElement | null) => {
    const ok = await copyText(text, container)
    if (!ok) setFallbackText(text)
    return ok
  }

  const fallback = (
    <CopyFallbackDialog text={fallbackText} onClose={() => setFallbackText(null)} />
  )

  return { copy, fallback }
}

function CopyFallbackDialog({ text, onClose }: { text: string | null; onClose: () => void }) {
  const rows = Math.min(8, Math.max(2, (text ?? "").split("\n").length + 1))

  return (
    <Dialog open={text !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="gap-0 bg-white p-6 sm:max-w-md">
        <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
          <AlertCircle className="size-5 text-yellow-700" aria-hidden="true" />
          自動でコピーできませんでした
        </DialogTitle>
        <DialogDescription className="mt-1.5 text-sm text-neutral-500">
          このブラウザでは自動でコピーできませんでした。下の文字を長押し（パソコンは右クリック）してコピーしてください。
        </DialogDescription>
        <textarea
          readOnly
          rows={rows}
          value={text ?? ""}
          aria-label="コピーする文字"
          onFocus={(e) => e.currentTarget.select()}
          className="mt-4 block w-full resize-none break-all rounded-lg border border-neutral-300 bg-white px-3 py-2 text-base text-neutral-950 focus-visible:border-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950/10 sm:text-sm"
        />
        <div className="mt-5 flex justify-end">
          <button type="button" className={`${BTN_PRIMARY} w-full sm:w-auto`} onClick={onClose}>
            閉じる
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
