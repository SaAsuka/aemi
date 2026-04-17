"use client"

import { useActionState } from "react"
import { useRouter } from "next/navigation"
import { useEffect, useState, useCallback } from "react"
import { upload } from "@vercel/blob/client"
import { createOption, updateOption } from "@/lib/actions/option"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { OPTION_STATUS_LABELS, OPTION_CATEGORY_LABELS } from "@/types"
import { blobProxyUrl } from "@/lib/utils/blob"
import type { Option } from "@/generated/prisma/client"

type ActionResult = { success?: boolean; error?: Record<string, string[]> } | null

function optionAction(option?: Option) {
  return async (_prev: ActionResult, formData: FormData): Promise<ActionResult> => {
    if (option) {
      return await updateOption(option.id, formData)
    }
    return await createOption(formData)
  }
}

export function OptionForm({ option }: { option?: Option }) {
  const [state, action, isPending] = useActionState(optionAction(option), null)
  const router = useRouter()
  const [imageUrl, setImageUrl] = useState(option?.imageUrl ?? "")
  const [uploading, setUploading] = useState(false)

  const handleImageUpload = useCallback(async (file: File) => {
    setUploading(true)
    try {
      const blob = await upload(file.name, file, {
        access: "private",
        handleUploadUrl: "/api/upload",
      })
      setImageUrl(blob.url)
    } catch {
      alert("画像のアップロードに失敗しました")
    } finally {
      setUploading(false)
    }
  }, [])

  useEffect(() => {
    if (state?.success && !option) {
      router.push("/admin/options")
    }
  }, [state, option, router])

  return (
    <form action={action} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="status">ステータス</Label>
          <Select name="status" defaultValue={option?.status ?? "DRAFT"}>
            <SelectTrigger>
              <SelectValue>{(v) => OPTION_STATUS_LABELS[v] ?? v}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {Object.entries(OPTION_STATUS_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value} label={label}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {state?.error?.status && (
            <p className="text-sm text-destructive">{state.error.status[0]}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">カテゴリ</Label>
          <Select name="category" defaultValue={option?.category ?? "OTHER"}>
            <SelectTrigger>
              <SelectValue>{(v) => OPTION_CATEGORY_LABELS[v] ?? v}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {Object.entries(OPTION_CATEGORY_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value} label={label}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">オプション名 *</Label>
        <Input id="name" name="name" defaultValue={option?.name ?? ""} required />
        {state?.error?.name && (
          <p className="text-sm text-destructive">{state.error.name[0]}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">詳細内容</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={option?.description ?? ""}
          rows={4}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="price">価格 (円) *</Label>
          <Input id="price" name="price" type="number" defaultValue={option?.price ?? ""} required />
          {state?.error?.price && (
            <p className="text-sm text-destructive">{state.error.price[0]}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="deadline">締切</Label>
          <Input
            id="deadline"
            name="deadline"
            type="datetime-local"
            defaultValue={
              option?.deadline
                ? (() => {
                    const jst = new Date(new Date(option.deadline).getTime() + 9 * 60 * 60 * 1000)
                    const pad = (n: number) => String(n).padStart(2, "0")
                    const datePart = `${jst.getUTCFullYear()}-${pad(jst.getUTCMonth() + 1)}-${pad(jst.getUTCDate())}`
                    if (jst.getUTCHours() === 23 && jst.getUTCMinutes() === 59) {
                      return datePart
                    }
                    return `${datePart}T${pad(jst.getUTCHours())}:${pad(jst.getUTCMinutes())}`
                  })()
                : ""
            }
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="sortOrder">表示順</Label>
        <Input
          id="sortOrder"
          name="sortOrder"
          type="number"
          defaultValue={option?.sortOrder ?? 0}
          className="max-w-32"
        />
        <p className="text-xs text-muted-foreground">小さい数字が先に表示されます</p>
      </div>

      <div className="space-y-2">
        <Label>画像</Label>
        <input type="hidden" name="imageUrl" value={imageUrl} />
        {imageUrl ? (
          <div className="space-y-2">
            <img
              src={blobProxyUrl(imageUrl, true)}
              alt="オプション画像"
              className="w-48 h-48 object-cover rounded-lg border"
            />
            <button
              type="button"
              onClick={() => setImageUrl("")}
              className="text-xs text-red-600 hover:underline"
            >
              画像を削除
            </button>
          </div>
        ) : (
          <Input
            type="file"
            accept="image/*"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleImageUpload(file)
            }}
          />
        )}
        {uploading && <p className="text-xs text-muted-foreground">アップロード中...</p>}
      </div>

      {state?.success && option && (
        <p className="text-sm text-green-600">更新しました</p>
      )}

      <Button type="submit" disabled={isPending || uploading}>
        {isPending ? "保存中..." : option ? "更新" : "作成"}
      </Button>
    </form>
  )
}
