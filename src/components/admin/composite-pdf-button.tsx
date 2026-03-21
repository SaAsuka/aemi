"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { FileText, RefreshCw, ExternalLink, Loader2 } from "lucide-react"

async function generatePdf(talentId: string) {
  const res = await fetch(`/api/talents/${talentId}/composite`)
  if (!res.ok) {
    let detail = ""
    try {
      const json = await res.json()
      detail = json.error || JSON.stringify(json)
    } catch {
      detail = await res.text().catch(() => `HTTP ${res.status}`)
    }
    throw new Error(`PDF生成に失敗しました: ${detail}`)
  }
  return res.blob()
}

export function CompositePdfButton({ talentId, resumeUrl }: { talentId: string; resumeUrl?: string | null }) {
  const [generating, setGenerating] = useState(false)

  const generate = async () => {
    setGenerating(true)
    try {
      const blob = await generatePdf(talentId)
      const url = URL.createObjectURL(blob)
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
      const blob = await generatePdf(talentId)
      const url = URL.createObjectURL(blob)
      window.open(url, "_blank")
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
