"use client"

import { useState, useRef } from "react"
import { upload } from "@vercel/blob/client"
import { registerTalent } from "@/lib/actions/talent-register"
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
import { X, ImagePlus, Loader2, RefreshCw } from "lucide-react"

type ActionResult = { success?: boolean; error?: Record<string, string[]> } | null
type PhotoSlot = { file: File; preview: string } | null

const PHOTO_SLOTS = [
  { label: "バストアップ", description: "上半身の写真" },
  { label: "全身", description: "全身の写真" },
  { label: "コンポジ用①" },
  { label: "コンポジ用②" },
  { label: "コンポジ用③" },
  { label: "コンポジ用④" },
] as const

export function TalentRegisterForm() {
  const [photos, setPhotos] = useState<PhotoSlot[]>([null, null, null, null, null, null])
  const [uploading, setUploading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [state, setState] = useState<ActionResult>(null)
  const [isPending, setIsPending] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const activeSlotRef = useRef<number>(0)

  const openFilePicker = (slotIndex: number) => {
    activeSlotRef.current = slotIndex
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const slotIndex = activeSlotRef.current
    setPhotos(prev => {
      const next = [...prev]
      if (next[slotIndex]) URL.revokeObjectURL(next[slotIndex]!.preview)
      next[slotIndex] = { file, preview: URL.createObjectURL(file) }
      return next
    })
    e.target.value = ""
  }

  const removePhoto = (slotIndex: number) => {
    setPhotos(prev => {
      const next = [...prev]
      if (next[slotIndex]) URL.revokeObjectURL(next[slotIndex]!.preview)
      next[slotIndex] = null
      return next
    })
  }

  const allSlotsFilled = photos.every(p => p !== null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!allSlotsFilled) {
      setSubmitError("写真を6枚すべて設定してください")
      return
    }
    setIsPending(true)
    setSubmitError(null)

    try {
      setUploading(true)
      const photoUrls: string[] = []
      for (const photo of photos) {
        const blob = await upload(photo!.file.name, photo!.file, {
          access: "private",
          handleUploadUrl: "/api/upload",
        })
        photoUrls.push(blob.url)
      }
      setUploading(false)

      const formData = new FormData(formRef.current!)
      formData.set("photoUrls", JSON.stringify(photoUrls))
      const result = await registerTalent(formData)
      setState(result)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "エラーが発生しました")
    } finally {
      setIsPending(false)
      setUploading(false)
    }
  }

  if (state?.success) {
    return (
      <div className="text-center py-12 space-y-4">
        <div className="text-4xl">&#10003;</div>
        <h2 className="text-xl font-bold">登録が完了しました</h2>
        <p className="text-muted-foreground">ご登録ありがとうございます。担当者より追ってご連絡いたします。</p>
      </div>
    )
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="lastName">姓 *</Label>
          <Input id="lastName" name="lastName" required />
          {state?.error?.lastName && <p className="text-sm text-destructive">{state.error.lastName[0]}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="firstName">名 *</Label>
          <Input id="firstName" name="firstName" required />
          {state?.error?.firstName && <p className="text-sm text-destructive">{state.error.firstName[0]}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="lastNameKana">セイ *</Label>
          <Input id="lastNameKana" name="lastNameKana" required />
          {state?.error?.lastNameKana && <p className="text-sm text-destructive">{state.error.lastNameKana[0]}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="firstNameKana">メイ *</Label>
          <Input id="firstNameKana" name="firstNameKana" required />
          {state?.error?.firstNameKana && <p className="text-sm text-destructive">{state.error.firstNameKana[0]}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="nameRomaji">ローマ字名</Label>
          <Input id="nameRomaji" name="nameRomaji" placeholder="例: Taro Yamada" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">芸能カテゴリ</Label>
          <Input id="category" name="category" placeholder="例: 俳優、モデル、声優" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="email">メールアドレス</Label>
          <Input id="email" name="email" type="email" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">電話番号</Label>
          <Input id="phone" name="phone" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="gender">性別</Label>
          <Select name="gender">
            <SelectTrigger>
              <SelectValue placeholder="選択">{(v) => v ? ({ MALE: "男性", FEMALE: "女性", OTHER: "その他" } as Record<string, string>)[v] ?? v : "選択"}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MALE" label="男性">男性</SelectItem>
              <SelectItem value="FEMALE" label="女性">女性</SelectItem>
              <SelectItem value="OTHER" label="その他">その他</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="birthDate">生年月日</Label>
          <Input id="birthDate" name="birthDate" type="date" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="height">身長 (cm)</Label>
          <Input id="height" name="height" type="number" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor="bust">バスト (cm)</Label>
          <Input id="bust" name="bust" type="number" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="waist">ウエスト (cm)</Label>
          <Input id="waist" name="waist" type="number" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="hip">ヒップ (cm)</Label>
          <Input id="hip" name="hip" type="number" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="shoeSize">靴サイズ (cm)</Label>
          <Input id="shoeSize" name="shoeSize" type="number" step="0.5" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="birthplace">出身地</Label>
          <Input id="birthplace" name="birthplace" placeholder="例: 東京都" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="address">現住所</Label>
          <Input id="address" name="address" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="skills">特技</Label>
          <Input id="skills" name="skills" placeholder="例: インドネシア語、殺陣" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="hobbies">趣味</Label>
          <Input id="hobbies" name="hobbies" placeholder="例: 釣り、料理、ゴルフ" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="qualifications">資格</Label>
        <Input id="qualifications" name="qualifications" placeholder="例: 普通自動車免許、英検2級" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="career">経歴</Label>
        <Textarea id="career" name="career" rows={4} placeholder="出演歴・受賞歴など" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="representativeWork">代表作</Label>
        <Textarea id="representativeWork" name="representativeWork" rows={2} placeholder="代表的な出演作品" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="nearestStation">最寄駅</Label>
          <Input id="nearestStation" name="nearestStation" placeholder="例: 渋谷駅" />
        </div>
      </div>

      <h3 className="text-sm font-semibold text-muted-foreground pt-2">SNS情報</h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="instagramUrl">Instagram URL</Label>
          <Input id="instagramUrl" name="instagramUrl" placeholder="https://instagram.com/..." />
        </div>
        <div className="space-y-2">
          <Label htmlFor="xUrl">X (Twitter) URL</Label>
          <Input id="xUrl" name="xUrl" placeholder="https://x.com/..." />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tiktokUrl">TikTok URL</Label>
          <Input id="tiktokUrl" name="tiktokUrl" placeholder="https://tiktok.com/..." />
        </div>
        <div className="space-y-2">
          <Label htmlFor="websiteUrl">公式HP等</Label>
          <Input id="websiteUrl" name="websiteUrl" placeholder="https://..." />
        </div>
      </div>

      <h3 className="text-sm font-semibold text-muted-foreground pt-2">振込先情報</h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="bankName">銀行名</Label>
          <Input id="bankName" name="bankName" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bankBranch">支店名</Label>
          <Input id="bankBranch" name="bankBranch" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bankAccountType">種別</Label>
          <Select name="bankAccountType">
            <SelectTrigger>
              <SelectValue placeholder="選択">{(v) => v || "選択"}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="普通" label="普通">普通</SelectItem>
              <SelectItem value="当座" label="当座">当座</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="bankAccountNumber">口座番号</Label>
          <Input id="bankAccountNumber" name="bankAccountNumber" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bankAccountHolder">口座名義</Label>
          <Input id="bankAccountHolder" name="bankAccountHolder" />
        </div>
      </div>

      <h3 className="text-sm font-semibold text-muted-foreground pt-2">宣材写真 *</h3>
      <p className="text-xs text-muted-foreground">6枚すべて必須です。コンポジPDFに使用されます。</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {PHOTO_SLOTS.map((slot, i) => (
          <div key={i} className="space-y-1">
            <p className="text-xs font-medium">
              {slot.label} <span className="text-destructive">*</span>
            </p>
            {"description" in slot && (
              <p className="text-[10px] text-muted-foreground">{slot.description}</p>
            )}
            {photos[i] ? (
              <div className="relative aspect-[3/4] rounded border overflow-hidden group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photos[i]!.preview} alt={slot.label} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button type="button" onClick={() => openFilePicker(i)} className="bg-white text-black rounded-full p-2" title="変更">
                    <RefreshCw className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => removePhoto(i)} className="bg-destructive text-destructive-foreground rounded-full p-2" title="削除">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => openFilePicker(i)}
                className="w-full aspect-[3/4] border-2 border-dashed rounded flex flex-col items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors"
              >
                <ImagePlus className="h-6 w-6" />
                <span className="text-xs mt-1">選択</span>
              </button>
            )}
          </div>
        ))}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {submitError && <p className="text-sm text-destructive">{submitError}</p>}

      <Button type="submit" disabled={isPending || !allSlotsFilled} className="w-full">
        {uploading ? (
          <><Loader2 className="h-4 w-4 animate-spin mr-2" />写真アップロード中...</>
        ) : isPending ? "送信中..." : !allSlotsFilled ? "写真を6枚すべて設定してください" : "登録する"}
      </Button>
    </form>
  )
}
