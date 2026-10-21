"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Trash2, GripVertical, Plus, Loader2 } from "lucide-react"
import { addTalentWork, deleteTalentWork, updateTalentWork, reorderTalentWorks } from "@/lib/actions/talent-work"
import { blobProxyUrl } from "@/lib/utils/blob"
import type { TalentWork } from "@/generated/prisma/client"
import { SortableGrid } from "@/components/sortable-grid"

export function TalentWorks({
  talentId,
  works: initialWorks,
  buttonClassName,
  inputClassName,
  itemClassName,
}: {
  talentId: string
  works: TalentWork[]
  // 見た目を画面ごとに変えたいとき用（未指定なら従来どおり）
  buttonClassName?: string
  inputClassName?: string
  itemClassName?: string
}) {
  const [works, setWorks] = useState(initialWorks)
  const [uploading, setUploading] = useState(false)
  const [caption, setCaption] = useState("")
  const [reorderError, setReorderError] = useState<string | null>(null)

  const handleAdd = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!caption.trim()) {
      alert("キャプションを入力してください")
      return
    }
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("category", "works")
      formData.append("id", talentId)
      const res = await fetch("/api/upload", { method: "POST", body: formData })
      if (!res.ok) throw new Error((await res.json()).error ?? "アップロードに失敗しました")
      const { url } = await res.json()
      await addTalentWork(talentId, url, caption.trim())
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

  // 並べ替えたらすぐ画面に反映し、保存に失敗したら元の並びに戻す
  const handleReorder = useCallback(async (next: TalentWork[]) => {
    const prev = works
    setWorks(next)
    setReorderError(null)
    try {
      await reorderTalentWorks(talentId, next.map(w => w.id))
    } catch (err) {
      console.error("過去作品の並べ替えエラー:", err)
      setWorks(prev)
      setReorderError("並べ替えを保存できませんでした。もう一度お試しください")
    }
  }, [works, talentId])

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          placeholder="キャプション（作品名など）"
          value={caption}
          onChange={e => setCaption(e.target.value)}
          className={`flex-1 ${inputClassName ?? ""}`}
        />
        <Button type="button" variant="outline" size="sm" disabled={uploading || !caption.trim()} onClick={() => document.getElementById(`work-upload-${talentId}`)?.click()} className={`shrink-0 ${buttonClassName ?? ""}`}>
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

      {reorderError && (
        <p role="alert" className="text-sm text-red-600">{reorderError}</p>
      )}

      {works.length > 0 && (
        <SortableGrid
          items={works}
          onReorder={handleReorder}
          dragFrom="handle"
          unit="件"
          className="space-y-3"
          renderItem={(work, idx, { handleProps, isDragging }) => (
            <div
              className={`flex items-start gap-3 border rounded-lg p-2 bg-white transition-shadow ${itemClassName ?? ""} ${isDragging ? "shadow-xl ring-2 ring-neutral-950" : ""}`}
            >
              {/* 作品名の入力欄で文字を選べるよう、並べ替えはこのつまみから。スマホは長押しで掴む */}
              <button
                type="button"
                {...handleProps}
                aria-label={`${idx + 1}件目の作品を並べ替える`}
                style={{ WebkitTouchCallout: "none" }}
                className="mt-1 -ml-1 flex size-10 shrink-0 cursor-grab touch-manipulation select-none items-center justify-center rounded-md text-muted-foreground hover:bg-neutral-100 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950/30"
              >
                <GripVertical className="h-4 w-4" aria-hidden="true" />
              </button>
              <img src={blobProxyUrl(work.imageUrl)} alt={work.caption} draggable={false} className="w-24 h-24 object-cover rounded" />
              <div className="flex-1 space-y-1">
                <Input
                  defaultValue={work.caption}
                  onBlur={e => {
                    if (e.target.value !== work.caption) handleCaptionUpdate(work.id, e.target.value)
                  }}
                  aria-label={`${idx + 1}件目の作品名`}
                  className={`text-sm ${inputClassName ?? ""}`}
                />
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={() => handleDelete(work.id)} aria-label={`${idx + 1}件目の作品を削除`}>
                <Trash2 className="h-4 w-4 text-red-500" aria-hidden="true" />
              </Button>
            </div>
          )}
        />
      )}
    </div>
  )
}
