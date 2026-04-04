"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { upload } from "@vercel/blob/client"
import { Button } from "@/components/ui/button"
import { FileText, RefreshCw, ExternalLink, Loader2, Upload } from "lucide-react"
import { blobProxyUrl } from "@/lib/utils/blob"
import { saveResumeUrl } from "@/lib/actions/talent"

async function generatePdf(talentId: string, force = false): Promise<string | null> {
  const url = `/api/talents/${talentId}/composite${force ? "?force=true" : ""}`
  const res = await fetch(url)

  if (res.status === 409) {
    return null
  }

  if (!res.ok) {
    let detail = `HTTP ${res.status}`
    try {
      const json = await res.json()
      if (json.errors && Array.isArray(json.errors)) detail = json.errors.join("\n")
    } catch {
      try { detail = await res.text() } catch { /* ignore */ }
    }
    throw new Error(`PDF生成に失敗しました:\n${detail}`)
  }

  const blobError = res.headers.get("X-Blob-Error")
  if (blobError) throw new Error(`PDF生成は成功しましたが保存に失敗しました:\n${blobError}`)

  return res.headers.get("X-Blob-Url")
}

export function CompositePdfButton({
  talentId,
  resumeUrl,
  resumeSource,
  photoCount,
}: {
  talentId: string
  resumeUrl?: string | null
  resumeSource?: string | null
  photoCount: number
}) {
  const [generating, setGenerating] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [pdfLink, setPdfLink] = useState(() => resumeUrl ? blobProxyUrl(resumeUrl, true) : null)
  const [source, setSource] = useState(resumeSource ?? "auto")
  const fileRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const generate = async () => {
    if (photoCount !== 6) {
      alert(photoCount < 6
        ? `宣材写真が${photoCount}枚しか登録されていません。コンポジ生成には6枚必要です。`
        : `宣材写真が${photoCount}枚登録されています。6枚にしてください（${photoCount - 6}枚超過）。`)
      return
    }

    let force = false
    if (source === "manual") {
      if (!confirm("手動アップロードされたPDFがあります。自動生成で上書きしますか？")) return
      force = true
    }

    setGenerating(true)
    try {
      const blobUrl = await generatePdf(talentId, force)
      if (blobUrl) {
        await saveResumeUrl(talentId, blobUrl, "auto")
        setPdfLink(blobProxyUrl(blobUrl, true))
        setSource("auto")
      }
      router.refresh()
    } catch (e) {
      alert(e instanceof Error ? e.message : "エラーが発生しました")
    } finally {
      setGenerating(false)
    }
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type !== "application/pdf") {
      alert("PDFファイルを選択してください")
      return
    }

    setUploading(true)
    try {
      const blob = await upload(`composites/${talentId}.pdf`, file, {
        access: "private",
        handleUploadUrl: "/api/upload",
        clientPayload: JSON.stringify({ talentId }),
      })
      await saveResumeUrl(talentId, blob.url, "manual")
      setPdfLink(blobProxyUrl(blob.url, true))
      setSource("manual")
      router.refresh()
    } catch (err) {
      alert(err instanceof Error ? err.message : "アップロードに失敗しました")
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  const displayUrl = pdfLink ?? (resumeUrl ? blobProxyUrl(resumeUrl, true) : null)
  const busy = generating || uploading

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button onClick={generate} disabled={busy} variant="outline" size="sm">
        {generating ? (
          <Loader2 className="h-4 w-4 animate-spin mr-1" />
        ) : resumeUrl ? (
          <RefreshCw className="h-4 w-4 mr-1" />
        ) : (
          <FileText className="h-4 w-4 mr-1" />
        )}
        {generating ? "生成中..." : resumeUrl ? "PDF再生成" : "コンポジPDF生成"}
      </Button>
      <Button onClick={() => fileRef.current?.click()} disabled={busy} variant="outline" size="sm">
        {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Upload className="h-4 w-4 mr-1" />}
        {uploading ? "アップロード中..." : "コンポジアップロード"}
      </Button>
      <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={handleUpload} />
      {displayUrl && (
        <a href={displayUrl} target="_blank" rel="noopener noreferrer">
          <Button variant="ghost" size="sm">
            <ExternalLink className="h-4 w-4 mr-1" />
            PDFを表示
            {source === "manual" && <span className="ml-1 text-xs text-blue-500">(手動)</span>}
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
        await saveResumeUrl(talentId, blobUrl, "auto")
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
