"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { FileText, RefreshCw, ExternalLink, Loader2 } from "lucide-react"
import { blobProxyUrl } from "@/lib/utils/blob"
import { saveResumeUrl } from "@/lib/actions/talent"

async function generatePdf(talentId: string): Promise<string | null> {
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

  console.log(`[CompositePDF] サーバー処理時間=${res.headers.get("X-Composite-Time") ?? "不明"}`)

  const blobError = res.headers.get("X-Blob-Error")
  if (blobError) {
    console.warn(`[CompositePDF] Blob保存失敗: ${blobError}`)
    throw new Error(`PDF生成は成功しましたが保存に失敗しました:\n${blobError}`)
  }

  return res.headers.get("X-Blob-Url")
}

export function CompositePdfButton({ talentId, resumeUrl, photoCount }: { talentId: string; resumeUrl?: string | null; photoCount: number }) {
  const [generating, setGenerating] = useState(false)
  const [pdfLink, setPdfLink] = useState(() => resumeUrl ? blobProxyUrl(resumeUrl, true) : null)
  const router = useRouter()

  const generate = async () => {
    if (photoCount !== 6) {
      alert(photoCount < 6
        ? `宣材写真が${photoCount}枚しか登録されていません。コンポジ生成には6枚必要です。`
        : `宣材写真が${photoCount}枚登録されています。6枚にしてください（${photoCount - 6}枚超過）。`)
      return
    }
    setGenerating(true)
    try {
      const blobUrl = await generatePdf(talentId)
      if (blobUrl) {
        await saveResumeUrl(talentId, blobUrl)
        setPdfLink(blobProxyUrl(blobUrl, true))
      }
      router.refresh()
    } catch (e) {
      alert(e instanceof Error ? e.message : "エラーが発生しました")
    } finally {
      setGenerating(false)
    }
  }

  const displayUrl = pdfLink ?? (resumeUrl ? blobProxyUrl(resumeUrl, true) : null)

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
      {displayUrl && (
        <a href={displayUrl} target="_blank" rel="noopener noreferrer">
          <Button variant="ghost" size="sm">
            <ExternalLink className="h-4 w-4 mr-1" />
            PDFを表示
          </Button>
        </a>
      )}
    </div>
  )
}

export function CompositePdfIconButton({ talentId, photoCount }: { talentId: string; photoCount: number }) {
  const [generating, setGenerating] = useState(false)
  const router = useRouter()

  const generate = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (photoCount !== 6) {
      alert(photoCount < 6
        ? `宣材写真が${photoCount}枚しか登録されていません。コンポジ生成には6枚必要です。`
        : `宣材写真が${photoCount}枚登録されています。6枚にしてください（${photoCount - 6}枚超過）。`)
      return
    }
    setGenerating(true)
    try {
      const blobUrl = await generatePdf(talentId)
      if (blobUrl) {
        await saveResumeUrl(talentId, blobUrl)
      }
      router.refresh()
    } catch (err) {
      alert(err instanceof Error ? err.message : "エラーが発生しました")
    } finally {
      setGenerating(false)
    }
  }

  if (generating) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground animate-pulse">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        生成中…
      </span>
    )
  }

  return (
    <Button onClick={generate} variant="ghost" size="icon" title="コンポジPDF生成">
      <FileText className="h-4 w-4" />
    </Button>
  )
}
