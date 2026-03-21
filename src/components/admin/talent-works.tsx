"use client"

import { useState, useCallback } from "react"
import { upload } from "@vercel/blob/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Trash2, GripVertical, Plus, Loader2 } from "lucide-react"
import { addTalentWork, deleteTalentWork, updateTalentWork, reorderTalentWorks } from "@/lib/actions/talent-work"
import type { TalentWork } from "@/generated/prisma/client"

export function TalentWorks({ talentId, works: initialWorks }: { talentId: string; works: TalentWork[] }) {
  const [works, setWorks] = useState(initialWorks)
  const [uploading, setUploading] = useState(false)
  const [caption, setCaption] = useState("")
  const [dragIdx, setDragIdx] = useState<number | null>(null)

  const handleAdd = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!caption.trim()) {
      alert("キャプションを入力してください")
      return
    }
    setUploading(true)
    try {
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/upload",
      })
      await addTalentWork(talentId, blob.url, caption.trim())
      setCaption("")
      window.location.reload()
    } finally {
      setUploading(false)
    }
  }, [talentId, caption])

  const handleDelete = useCallback(async (id: string) => {
    setWorks(prev => prev.filter(w => w.id !== id))
    await deleteTalentWork(id, talentId)
  }, [talentId])

  const handleCaptionUpdate = useCallback(async (id: string, newCaption: string) => {
    setWorks(prev => prev.map(w => w.id === id ? { ...w, caption: newCaption } : w))
    await updateTalentWork(id, talentId, newCaption)
  }, [talentId])

  const handleDragStart = (idx: number) => setDragIdx(idx)

  const handleDrop = useCallback(async (targetIdx: number) => {
    if (dragIdx === null || dragIdx === targetIdx) return
    const reordered = [...works]
    const [moved] = reordered.splice(dragIdx, 1)
    reordered.splice(targetIdx, 0, moved)
    setWorks(reordered)
    setDragIdx(null)
    await reorderTalentWorks(talentId, reordered.map(w => w.id))
  }, [dragIdx, works, talentId])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Input
          placeholder="キャプション（作品名など）"
          value={caption}
          onChange={e => setCaption(e.target.value)}
          className="max-w-xs"
        />
        <Button type="button" variant="outline" size="sm" disabled={uploading || !caption.trim()} onClick={() => document.getElementById(`work-upload-${talentId}`)?.click()}>
          {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
          追加
        </Button>
        <input
          id={`work-upload-${talentId}`}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleAdd}
          disabled={uploading}
        />
      </div>

      {works.length > 0 && (
        <div className="space-y-3">
          {works.map((work, idx) => (
            <div
              key={work.id}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={e => e.preventDefault()}
              onDrop={() => handleDrop(idx)}
              className={`flex items-start gap-3 border rounded-lg p-2 ${dragIdx === idx ? "opacity-50" : ""}`}
            >
              <button type="button" className="cursor-grab mt-2 text-muted-foreground">
                <GripVertical className="h-4 w-4" />
              </button>
              <img src={work.imageUrl} alt={work.caption} className="w-24 h-24 object-cover rounded" />
              <div className="flex-1 space-y-1">
                <Input
                  defaultValue={work.caption}
                  onBlur={e => {
                    if (e.target.value !== work.caption) handleCaptionUpdate(work.id, e.target.value)
                  }}
                  className="text-sm"
                />
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={() => handleDelete(work.id)}>
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
