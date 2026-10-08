"use client"

import { useEffect, useState } from "react"
import { ExternalLink, Loader2 } from "lucide-react"
import { BTN_PRIMARY, BTN_SECONDARY } from "@/components/admin/styles"

// freee のログイン画面へ移って連携する（連携済みなら、つなぎ直す）
export function FreeeConnectButton({ connected, className = "" }: { connected: boolean; className?: string }) {
  const [moving, setMoving] = useState(false)

  // ブラウザの「戻る」でこの画面に戻ってきたら、ボタンを元に戻す
  useEffect(() => {
    const onPageShow = () => setMoving(false)
    window.addEventListener("pageshow", onPageShow)
    return () => window.removeEventListener("pageshow", onPageShow)
  }, [])

  return (
    <a
      href="/api/freee/auth"
      onClick={(e) => {
        // 新しいタブで開いたときは、この画面はそのまま
        if (e.metaKey || e.ctrlKey || e.shiftKey) return
        setMoving(true)
      }}
      aria-disabled={moving || undefined}
      className={`${connected ? BTN_SECONDARY : BTN_PRIMARY} ${moving ? "pointer-events-none opacity-70" : ""} ${className}`}
    >
      {moving ? <Loader2 className="animate-spin" aria-hidden="true" /> : <ExternalLink aria-hidden="true" />}
      {moving ? "freeeに移動しています…" : connected ? "freeeとつなぎ直す" : "freeeと連携する"}
    </a>
  )
}
