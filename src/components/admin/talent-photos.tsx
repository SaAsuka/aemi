"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Trash2, GripVertical, Plus, Loader2 } from "lucide-react"
import { addTalentPhoto, deleteTalentPhoto, reorderTalentPhotos } from "@/lib/actions/talent-photo"
import { blobProxyUrl } from "@/lib/utils/blob"
import type { TalentPhoto } from "@/generated/prisma/client"
import { SortableGrid } from "@/components/sortable-grid"

export function TalentPhotos({
  talentId,
  photos: initialPhotos,
  buttonClassName,
  tileClassName,
}: {
  talentId: string
  photos: TalentPhoto[]
  // 見た目を画面ごとに変えたいとき用（未指定なら従来どおり）
  buttonClassName?: string
  tileClassName?: string
}) {
  const [photos, setPhotos] = useState(initialPhotos)
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})
  const [error, setError] = useState<string | null>(null)

  const uploading = Object.keys(uploadProgress).length > 0

  const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files?.length) return
    setError(null)
    try {
      for (const file of Array.from(files)) {
        setUploadProgress((prev) => ({ ...prev, [file.name]: 0 }))
        const formData = new FormData()
        // ファイル名に日本語等の非ASCII文字が含まれるとSafariで
        // 「The string did not match the expected pattern.」が発生することがあるため、
        // 拡張子だけ残して安全なファイル名に付け替える
        const ext = file.name.split(".").pop() || "jpg"
        const safeFile = new File([file], `photo-${Date.now()}.${ext}`, { type: file.type })
        formData.append("file", safeFile)
        formData.append("category", "photos")
        formData.append("id", talentId)
        const res = await fetch("/api/upload", { method: "POST", body: formData })
        if (!res.ok) throw new Error((await res.json()).error ?? "アップロードに失敗しました")
        const { url } = await res.json()
        setUploadProgress((prev) => {
          const next = { ...prev }
          delete next[file.name]
          return next
        })
        await addTalentPhoto(talentId, url)
      }
      window.location.reload()
    } catch (err) {
      const msg = err instanceof Error ? err.message : "アップロードに失敗しました"
      setError(msg)
      console.error("写真アップロードエラー:", err)
      setUploadProgress({})
    }
  }, [talentId])

  const handleDelete = useCallback(async (id: string) => {
    setPhotos(prev => prev.filter(p => p.id !== id))
    await deleteTalentPhoto(id, talentId)
  }, [talentId])

  // 並べ替えたらすぐ画面に反映し、保存に失敗したら元の並びに戻す
  const handleReorder = useCallback(async (next: TalentPhoto[]) => {
    const prev = photos
    setPhotos(next)
    setError(null)
    try {
      await reorderTalentPhotos(talentId, next.map(p => p.id))
    } catch (err) {
      console.error("写真の並べ替えエラー:", err)
      setPhotos(prev)
      setError("並べ替えを保存できませんでした。もう一度お試しください")
    }
  }, [photos, talentId])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" size="sm" className={buttonClassName} disabled={uploading} onClick={() => document.getElementById(`photo-upload-${talentId}`)?.click()}>
          {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
          写真を追加
        </Button>
        <input
          id={`photo-upload-${talentId}`}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleUpload}
          disabled={uploading}
        />
        <p className="text-xs text-muted-foreground">
          先頭2枚がプロフィール1ページ目、残りはギャラリーページに表示。
          <span className="inline-block">写真をドラッグ（スマホは長押し）で並べ替えできます</span>
        </p>
      </div>
      {Object.entries(uploadProgress).map(([name, pct]) => (
        <div key={name} className="space-y-1">
          <p className="text-xs text-muted-foreground truncate">{name}</p>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      ))}
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      {photos.length > 0 && (
        <SortableGrid
          items={photos}
          onReorder={handleReorder}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3"
          renderItem={(photo, idx, { handleProps, isDragging }) => {
            const label = idx === 0 ? "バストアップ" : idx === 1 ? "全身" : `#${idx + 1}`
            return (
              <div
                className={`relative group border rounded-lg overflow-hidden bg-white transition-shadow ${tileClassName ?? ""} ${isDragging ? "opacity-80 shadow-xl ring-2 ring-neutral-950" : ""}`}
              >
                <img src={blobProxyUrl(photo.url)} alt={`宣材写真 ${idx + 1}`} draggable={false} className="w-full aspect-[3/4] object-cover pointer-events-none" />
                <div className="absolute top-1 left-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
                  {label}
                </div>
                <div className="absolute top-1 right-1 flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 transition">
                  <button
                    type="button"
                    {...handleProps}
                    aria-label={`${label}の写真を並べ替える`}
                    className="bg-black/60 text-white p-2 rounded cursor-grab focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  >
                    <GripVertical className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(photo.id)}
                    aria-label={`${label}の写真を削除`}
                    className="bg-red-600 text-white p-2 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            )
          }}
        />
      )}
    </div>
  )
}
