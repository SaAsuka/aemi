"use client"

import { useFormStatus } from "react-dom"
import { Loader2 } from "lucide-react"
import { BTN_PRIMARY } from "@/components/talent/styles"

// 決済画面へ移るまで数秒かかるので、押したことが分かるようにする（二度押しも防ぐ）
export function PurchaseButton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className={`${BTN_PRIMARY} w-full disabled:bg-neutral-800 disabled:opacity-100`}>
      {pending ? (
        <>
          <Loader2 className="animate-spin" aria-hidden="true" />
          決済画面へ移動しています…
        </>
      ) : (
        "購入する"
      )}
    </button>
  )
}
