"use client"

import { useEffect } from "react"
import Link from "next/link"
import { AlertCircle } from "lucide-react"
import { BTN_PRIMARY, BTN_SECONDARY } from "@/components/admin/styles"

export default function TalentDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[TalentDetail]", error)
  }, [error])

  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <AlertCircle className="mx-auto size-10 text-red-600" aria-hidden="true" />
      <h2 className="mt-4 text-lg font-semibold text-neutral-950">タレント情報を表示できませんでした</h2>
      <p className="mt-2 text-sm leading-relaxed text-neutral-500">
        通信が不安定だった可能性があります。「もう一度読み込む」を押してください。
        <span className="inline-block">続く場合は、システム管理者にお問い合わせください。</span>
      </p>
      {(error.message || error.digest) && (
        <p className="mt-4 break-all rounded-lg bg-neutral-50 px-3 py-2 text-left font-mono text-xs text-neutral-500">
          {error.message || "不明なエラー"}
          {error.digest && <><br />ID: {error.digest}</>}
        </p>
      )}
      <div className="mt-6 flex flex-col-reverse justify-center gap-2 sm:flex-row">
        <Link href="/admin/talents" className={BTN_SECONDARY}>
          タレント一覧へ戻る
        </Link>
        <button type="button" onClick={reset} className={BTN_PRIMARY}>
          もう一度読み込む
        </button>
      </div>
    </div>
  )
}
