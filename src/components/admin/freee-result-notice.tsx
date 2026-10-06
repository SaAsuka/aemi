"use client"

import { useEffect } from "react"
import { CheckCircle2, AlertCircle } from "lucide-react"

// freee の画面から戻ってきたときの結果。再読み込みで同じ表示が出続けないよう、URLの印は消しておく
export function FreeeResultNotice({ result }: { result: "connected" | "error" }) {
  useEffect(() => {
    const url = new URL(window.location.href)
    url.searchParams.delete("freee")
    window.history.replaceState(window.history.state, "", url.pathname + url.search)
  }, [])

  if (result === "connected") {
    return (
      <div role="status" className="flex items-start gap-2.5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
        <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <p>
          <span className="font-medium">freeeと連携しました。</span>
          請求書の発行と、取引先の取り込みができるようになりました。
        </p>
      </div>
    )
  }
  return (
    <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <p>
        <span className="font-medium">freeeと連携できませんでした。</span>
        freeeの画面で「許可する」を押したか確認して、もう一度「freeeと連携する」を押してください。
      </p>
    </div>
  )
}
