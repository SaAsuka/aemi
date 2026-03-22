"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { FileText, RefreshCw, ExternalLink, Loader2 } from "lucide-react"

async function generatePdf(talentId: string): Promise<string> {
  console.log(`[CompositePDF] fetch開始 talentId=${talentId}`)
  const t0 = performance.now()

  const res = await fetch(`/api/talents/${talentId}/composite`)
  const elapsed = Math.round(performance.now() - t0)
  console.log(`[CompositePDF] fetch完了 status=${res.status} +${elapsed}ms`)

  if (!res.ok) {
    let detail = `HTTP ${res.status}`
    try {
      const json = await res.json()
      if (json.errors && Array.isArray(json.errors)) {
        detail = json.errors.join("\n")
      } else if (json.error) {
        detail = json.error
      }
    } catch {
      try { detail = await res.text() } catch { /* ignore */ }
    }
    console.error(`[CompositePDF] APIエラー: ${detail}`)
    throw new Error(`PDF生成に失敗しました (${elapsed}ms):\n${detail}`)
  }

  const blobUrl = res.headers.get("X-Blob-Url")
  console.log(`[CompositePDF] サーバー処理時間=${res.headers.get("X-Composite-Time") ?? "不明"} blobUrl=${blobUrl ?? "なし"}`)

  if (blobUrl) return blobUrl

  const pdfBlob = await res.blob()
  return URL.createObjectURL(pdfBlob)
}

export function CompositePdfButton({ talentId, resumeUrl }: { talentId: string; resumeUrl?: string | null }) {
  const [generating, setGenerating] = useState(false)

  const generate = async () => {
    setGenerating(true)
    try {
      const url = await generatePdf(talentId)
      window.open(url, "_blank")
      window.location.reload()
    } catch (e) {
      alert(e instanceof Error ? e.message : "エラーが発生しました")
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button onClick={generate} disabled={generating} variant="outline" size="sm">
        {generating ? (
          <Loader2 className="h-4 w-4 animate-spin mr-1" />
        ) : resumeUrl ? (
          <RefreshCw className="h-4 w-4 mr-1" />
        ) : (
          <FileText className="h-4 w-4 mr-1" />
        )}
        {generating ? "生成中..." : resumeUrl ? "PDF再生成" : "コンポジPDF生成"}
      </Button>
      {resumeUrl && (
        <a href={resumeUrl} target="_blank" rel="noopener noreferrer">
          <Button variant="ghost" size="sm">
            <ExternalLink className="h-4 w-4 mr-1" />
            PDFを表示
          </Button>
        </a>
      )}
    </div>
  )
}

export function CompositePdfIconButton({ talentId }: { talentId: string }) {
  const [generating, setGenerating] = useState(false)

  const generate = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setGenerating(true)
    try {
      const url = await generatePdf(talentId)
      window.open(url, "_blank")
      window.location.reload()
    } catch (err) {
      alert(err instanceof Error ? err.message : "エラーが発生しました")
    } finally {
      setGenerating(false)
    }
  }

  return (
    <Button onClick={generate} disabled={generating} variant="ghost" size="icon" title="コンポジPDF生成">
      {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
    </Button>
  )
}
