"use client"

import { useState } from "react"
import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"

type Props = {
  action: () => Promise<string>
  filename: string
  // 見た目を画面ごとに変えたいとき用（未指定なら従来どおり）
  className?: string
}

export function CsvExportButton({ action, filename, className }: Props) {
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    try {
      const csv = await action()
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleClick} disabled={loading} className={className}>
      <Download className="h-4 w-4 mr-1" />
      {loading ? "出力中..." : "CSV出力"}
    </Button>
  )
}
