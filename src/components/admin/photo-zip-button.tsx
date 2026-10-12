"use client"

import { useState } from "react"
import { zipSync } from "fflate"
import { Download, Loader2 } from "lucide-react"
import { blobProxyUrl } from "@/lib/utils/blob"
import { BTN_SECONDARY } from "@/components/admin/styles"

type Entry = { fileUrl: string; name: string }

// 写真の中身を取る。まずストレージから直接（署名付きURL）、だめなら /api/blob 経由。
// サーバーでZIPを作ると応答本文の4.5MB上限に当たるので、ブラウザでまとめる
async function fetchPhoto(fileUrl: string): Promise<Uint8Array> {
  try {
    const signRes = await fetch(`/api/blob?url=${encodeURIComponent(fileUrl)}&sign=true`)
    if (signRes.ok) {
      const { url } = (await signRes.json()) as { url?: string }
      if (url) {
        const res = await fetch(url)
        if (res.ok) return new Uint8Array(await res.arrayBuffer())
      }
    }
  } catch {
    // 直接取れない（CORS など）ときは下の経路で取る
  }
  const res = await fetch(blobProxyUrl(fileUrl))
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return new Uint8Array(await res.arrayBuffer())
}

export function PhotoZipButton({ entries, zipName }: { entries: Entry[]; zipName: string }) {
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(0)
  const [failed, setFailed] = useState<Entry[]>([])

  if (entries.length === 0) return null

  const handleClick = async () => {
    setBusy(true)
    setDone(0)
    setFailed([])
    const files: Record<string, Uint8Array> = {}
    const ng: Entry[] = []
    for (const entry of entries) {
      try {
        files[entry.name] = await fetchPhoto(entry.fileUrl)
      } catch {
        ng.push(entry)
      }
      setDone((n) => n + 1)
    }
    if (Object.keys(files).length > 0) {
      // 写真はもう圧縮されているので、ZIPでは縮めない（速さ優先）
      const zipped = zipSync(files, { level: 0 })
      const url = URL.createObjectURL(new Blob([zipped as BlobPart], { type: "application/zip" }))
      const a = document.createElement("a")
      a.href = url
      a.download = zipName
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 10_000)
    }
    setFailed(ng)
    setBusy(false)
  }

  return (
    <div className="space-y-2">
      <button type="button" onClick={handleClick} disabled={busy} className={BTN_SECONDARY}>
        {busy ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Download aria-hidden="true" />}
        {busy ? `写真を集めています（${done}/${entries.length}）` : `写真をまとめてダウンロード（${entries.length}枚）`}
      </button>
      {failed.length > 0 && (
        <div className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 ring-1 ring-amber-200">
          <p>次の写真はまとめられませんでした。1枚ずつ保存してください。</p>
          <ul className="mt-1 list-disc pl-4">
            {failed.map((f) => (
              <li key={f.name}>
                <a href={blobProxyUrl(f.fileUrl)} target="_blank" rel="noopener noreferrer" className="underline">
                  {f.name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
