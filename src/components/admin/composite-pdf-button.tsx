"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
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

  const blobErrorRaw = res.headers.get("X-Blob-Error")
  if (blobErrorRaw) {
    let blobError = blobErrorRaw
    try {
      blobError = decodeURIComponent(blobErrorRaw)
    } catch {
      // 古い形式（エンコードされていない）のときはそのまま表示
    }
    throw new Error(`PDF生成は成功しましたが保存に失敗しました:\n${blobError}`)
  }

  return res.headers.get("X-Blob-Url")
}

export function CompositePdfButton({
  talentId,
  resumeUrl,
  resumeSource,
  photoCount,
  buttonClassName,
}: {
  talentId: string
  resumeUrl?: string | null
  resumeSource?: string | null
  photoCount: number
  // 見た目を画面ごとに変えたいとき用（未指定なら従来どおり）
  buttonClassName?: string
}) {
  const [generating, setGenerating] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [pdfLink, setPdfLink] = useState(() => resumeUrl ? blobProxyUrl(resumeUrl, true) : null)
  const [source, setSource] = useState(resumeSource ?? "auto")
  const fileRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const generate = async () => {
    if (photoCount < 6) {
      alert(`宣材写真が${photoCount}枚しか登録されていません。コンポジ生成には6枚以上必要です。`)
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
      const fd = new FormData()
      fd.append("file", file)
      fd.append("category", "pdfs")
      fd.append("id", talentId)
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error ?? "アップロードに失敗しました")
      }
      const { url } = await res.json()
      await saveResumeUrl(talentId, url, "manual")
      setPdfLink(blobProxyUrl(url, true))
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
      <Button onClick={generate} disabled={busy} variant="outline" size="sm" className={buttonClassName}>
        {generating ? (
          <Loader2 className="h-4 w-4 animate-spin mr-1" />
        ) : resumeUrl ? (
          <RefreshCw className="h-4 w-4 mr-1" />
        ) : (
          <FileText className="h-4 w-4 mr-1" />
        )}
        {generating ? "生成中..." : resumeUrl ? "PDF再生成" : "コンポジPDF生成"}
      </Button>
      <Button onClick={() => fileRef.current?.click()} disabled={busy} variant="outline" size="sm" className={buttonClassName}>
        {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Upload className="h-4 w-4 mr-1" />}
        {uploading ? "アップロード中..." : "コンポジアップロード"}
      </Button>
      <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={handleUpload} />
      {displayUrl && (
        <a href={displayUrl} target="_blank" rel="noopener noreferrer">
          <Button variant="ghost" size="sm" className={buttonClassName}>
            <ExternalLink className="h-4 w-4 mr-1" />
            コンポジを表示
            {source === "manual" && <span className="ml-1 text-xs text-blue-500">(手動)</span>}
          </Button>
        </a>
      )}
    </div>
  )
}

// タレント一覧で使う小さい生成ボタン。未作成なら「作成」、作成済みなら作り直しのアイコンだけを出す
export function CompositePdfIconButton({
  talentId,
  photoCount,
  hasResume = false,
}: {
  talentId: string
  photoCount: number
  hasResume?: boolean
}) {
  const [generating, setGenerating] = useState(false)
  const router = useRouter()

  const generate = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (photoCount < 6) {
      alert(`宣材写真が${photoCount}枚しか登録されていません。コンポジ生成には6枚以上必要です。`)
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
      <span className="inline-flex h-8 items-center gap-1.5 text-xs text-neutral-500" role="status">
        <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
        作成中…
      </span>
    )
  }

  if (hasResume) {
    return (
      <button
        type="button"
        onClick={generate}
        title="コンポジを作り直す"
        aria-label="コンポジを作り直す"
        className="inline-flex size-8 items-center justify-center rounded-md text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950/30"
      >
        <RefreshCw className="size-4" aria-hidden="true" />
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={generate}
      title="宣材写真からコンポジPDFを作成します"
      className="inline-flex h-8 items-center gap-1.5 rounded-md border border-neutral-300 bg-white px-2.5 text-xs font-medium text-neutral-800 transition-colors hover:border-neutral-400 hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950/30"
    >
      <FileText className="size-3.5" aria-hidden="true" />
      作成
    </button>
  )
}
