"use client"

import { useState } from "react"
import { upload } from "@vercel/blob/client"
import { saveResumeUrl } from "@/lib/actions/talent"
import { Button } from "@/components/ui/button"
import { FileText, RefreshCw, ExternalLink, Loader2 } from "lucide-react"

async function generateAndUpload(talentId: string): Promise<{ pdfUrl: string; blobUrl?: string }> {
  const res = await fetch(`/api/talents/${talentId}/composite`)
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
    throw new Error(`PDF生成に失敗しました:\n${detail}`)
  }
  const pdfBlob = await res.blob()
  const pdfUrl = URL.createObjectURL(pdfBlob)

  // Blobアップロード（失敗してもPDFは表示できる）
  try {
    const file = new File([pdfBlob], `${talentId}_composite.pdf`, { type: "application/pdf" })
    const uploaded = await upload(file.name, file, {
      access: "public",
      handleUploadUrl: "/api/upload",
    })
    await saveResumeUrl(talentId, uploaded.url)
    return { pdfUrl, blobUrl: uploaded.url }
  } catch {
    return { pdfUrl }
  }
}

export function CompositePdfButton({ talentId, resumeUrl }: { talentId: string; resumeUrl?: string | null }) {
  const [generating, setGenerating] = useState(false)

  const generate = async () => {
    setGenerating(true)
    try {
      const { pdfUrl, blobUrl } = await generateAndUpload(talentId)
      window.open(blobUrl || pdfUrl, "_blank")
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
      const { pdfUrl, blobUrl } = await generateAndUpload(talentId)
      window.open(blobUrl || pdfUrl, "_blank")
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
