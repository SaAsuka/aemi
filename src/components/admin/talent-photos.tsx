"use client"

import { useState, useCallback } from "react"
import { upload } from "@vercel/blob/client"
import { Button } from "@/components/ui/button"
import { Trash2, GripVertical, Plus, Loader2 } from "lucide-react"
import { addTalentPhoto, deleteTalentPhoto, reorderTalentPhotos } from "@/lib/actions/talent-photo"
import type { TalentPhoto } from "@/generated/prisma/client"

export function TalentPhotos({ talentId, photos: initialPhotos }: { talentId: string; photos: TalentPhoto[] }) {
  const [photos, setPhotos] = useState(initialPhotos)
  const [uploading, setUploading] = useState(false)
  const [dragIdx, setDragIdx] = useState<number | null>(null)

  const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files?.length) return
    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        const blob = await upload(file.name, file, {
          access: "public",
          handleUploadUrl: "/api/upload",
        })
        await addTalentPhoto(talentId, blob.url)
      }
      window.location.reload()
    } finally {
      setUploading(false)
    }
  }, [talentId])

  const handleDelete = useCallback(async (id: string) => {
    setPhotos(prev => prev.filter(p => p.id !== id))
    await deleteTalentPhoto(id, talentId)
  }, [talentId])

  const handleDragStart = (idx: number) => setDragIdx(idx)

  const handleDrop = useCallback(async (targetIdx: number) => {
    if (dragIdx === null || dragIdx === targetIdx) return
    const reordered = [...photos]
    const [moved] = reordered.splice(dragIdx, 1)
    reordered.splice(targetIdx, 0, moved)
    setPhotos(reordered)
    setDragIdx(null)
    await reorderTalentPhotos(talentId, reordered.map(p => p.id))
  }, [dragIdx, photos, talentId])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => document.getElementById(`photo-upload-${talentId}`)?.click()}>
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
        <p className="text-xs text-muted-foreground">先頭2枚がプロフィール1ページ目、残りはギャラリーページに表示</p>
      </div>

      {photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {photos.map((photo, idx) => (
            <div
              key={photo.id}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(idx)}
              className={`relative group border rounded-lg overflow-hidden ${dragIdx === idx ? "opacity-50" : ""}`}
            >
              <img src={photo.url} alt={`宣材写真 ${idx + 1}`} className="w-full aspect-[3/4] object-cover" />
              <div className="absolute top-1 left-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
                {idx === 0 ? "バストアップ" : idx === 1 ? "全身" : `#${idx + 1}`}
              </div>
              <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                <button type="button" className="bg-black/60 text-white p-1 rounded cursor-grab">
                  <GripVertical className="h-3.5 w-3.5" />
                </button>
                <button type="button" onClick={() => handleDelete(photo.id)} className="bg-red-600 text-white p-1 rounded">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
