"use client"

import { useActionState } from "react"
import { useRouter } from "next/navigation"
import { useEffect, useState, useCallback } from "react"
import { upload } from "@vercel/blob/client"
import { setupTalent } from "@/lib/actions/talent-setup"
import { addTalentPhoto, deleteTalentPhoto, reorderTalentPhotos } from "@/lib/actions/talent-photo"
import { blobProxyUrl } from "@/lib/utils/blob"
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
import { Plus, Loader2, Trash2, GripVertical, Camera, User, Ruler, Share2, CreditCard, Lock } from "lucide-react"
import type { TalentPhoto } from "@/generated/prisma/client"

type ActionResult = { success?: boolean; redirect?: string; error?: Record<string, string[]> } | null

async function setupAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  return await setupTalent(formData)
}

const photoLabels = ["バストアップ", "全身", "#3", "#4", "#5", "#6"]

function SetupPhotos({ talentId, photos: initialPhotos }: { talentId: string; photos: TalentPhoto[] }) {
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
          access: "private",
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

  const emptySlots = Math.max(0, 6 - photos.length)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{photos.length} / 6 枚</span>
          {photos.length === 6 && (
            <span className="text-xs text-green-600 font-medium">OK</span>
          )}
          {photos.length !== 6 && (
            <span className="text-xs text-amber-600">コンポジPDF生成には6枚必要です</span>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading || photos.length >= 6}
          onClick={() => document.getElementById("setup-photo-upload")?.click()}
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
          写真を追加
        </Button>
        <input
          id="setup-photo-upload"
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleUpload}
          disabled={uploading}
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        {photos.map((photo, idx) => (
          <div
            key={photo.id}
            draggable
            onDragStart={() => handleDragStart(idx)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(idx)}
            className={`relative group rounded-xl overflow-hidden border-2 border-border transition-all ${dragIdx === idx ? "opacity-50 scale-95" : "hover:border-primary/30"}`}
          >
            <img src={blobProxyUrl(photo.url)} alt={photoLabels[idx]} className="w-full aspect-[3/4] object-cover" />
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-2">
              <span className="text-white text-xs font-medium">{photoLabels[idx]}</span>
            </div>
            <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition">
              <button type="button" className="bg-black/60 text-white p-1 rounded-lg cursor-grab">
                <GripVertical className="h-3.5 w-3.5" />
              </button>
              <button type="button" onClick={() => handleDelete(photo.id)} className="bg-red-500/80 text-white p-1 rounded-lg hover:bg-red-500">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
        {Array.from({ length: emptySlots }).map((_, i) => (
          <button
            key={`empty-${i}`}
            type="button"
            onClick={() => document.getElementById("setup-photo-upload")?.click()}
            disabled={uploading}
            className="aspect-[3/4] rounded-xl border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center gap-2 text-muted-foreground/50 hover:border-primary/30 hover:text-primary/50 transition-colors"
          >
            <Camera className="h-6 w-6" />
            <span className="text-xs">{photoLabels[photos.length + i]}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export function TalentSetupForm({ email, talentId, photos }: { email: string; talentId: string; photos: TalentPhoto[] }) {
  const [state, action, isPending] = useActionState(setupAction, null)
  const router = useRouter()

  useEffect(() => {
    if (state?.success && state.redirect) {
      router.push(state.redirect)
    }
  }, [state, router])

  return (
    <div className="space-y-10">
      {/* 写真セクション */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Camera className="h-5 w-5 text-primary" />
          <h2 className="text-base font-semibold">宣材写真</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          コンポジPDF生成に必要な6枚の写真をアップロードしてください。先頭2枚はバストアップ・全身に使われます。
        </p>
        <SetupPhotos talentId={talentId} photos={photos} />
      </section>

      <form action={action} className="space-y-10">
        {/* 基本情報 */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            <h2 className="text-base font-semibold">基本情報</h2>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="lastName">姓 *</Label>
              <Input id="lastName" name="lastName" required />
              {state?.error?.lastName && (
                <p className="text-sm text-destructive">{state.error.lastName[0]}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="firstName">名 *</Label>
              <Input id="firstName" name="firstName" required />
              {state?.error?.firstName && (
                <p className="text-sm text-destructive">{state.error.firstName[0]}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="lastNameKana">セイ *</Label>
              <Input id="lastNameKana" name="lastNameKana" required />
              {state?.error?.lastNameKana && (
                <p className="text-sm text-destructive">{state.error.lastNameKana[0]}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="firstNameKana">メイ *</Label>
              <Input id="firstNameKana" name="firstNameKana" required />
              {state?.error?.firstNameKana && (
                <p className="text-sm text-destructive">{state.error.firstNameKana[0]}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="stageName">芸名</Label>
              <Input id="stageName" name="stageName" placeholder="コンポジPDFに表記される名前" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nameRomaji">ローマ字名</Label>
              <Input id="nameRomaji" name="nameRomaji" placeholder="例: Taro Yamada" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス</Label>
              <Input id="email" type="email" value={email} readOnly className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">電話番号</Label>
              <Input id="phone" name="phone" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="category">芸能カテゴリ</Label>
              <Input id="category" name="category" placeholder="例: 俳優、モデル、声優" />
            </div>
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
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="birthDate">生年月日</Label>
              <Input id="birthDate" name="birthDate" type="date" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="birthplace">出身地</Label>
              <Input id="birthplace" name="birthplace" placeholder="例: 東京都" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nearestStation">最寄駅</Label>
              <Input id="nearestStation" name="nearestStation" placeholder="例: 渋谷駅" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">現住所</Label>
            <Input id="address" name="address" />
          </div>
        </section>

        {/* 身体情報 */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Ruler className="h-5 w-5 text-primary" />
            <h2 className="text-base font-semibold">身体情報</h2>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
            <div className="space-y-2">
              <Label htmlFor="height">身長 (cm)</Label>
              <Input id="height" name="height" type="number" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bust">B (cm)</Label>
              <Input id="bust" name="bust" type="number" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="waist">W (cm)</Label>
              <Input id="waist" name="waist" type="number" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hip">H (cm)</Label>
              <Input id="hip" name="hip" type="number" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shoeSize">靴 (cm)</Label>
              <Input id="shoeSize" name="shoeSize" type="number" step="0.5" />
            </div>
          </div>
        </section>

        {/* スキル・経歴 */}
        <section className="space-y-4">
          <h2 className="text-base font-semibold">スキル・経歴</h2>
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
        </section>

        {/* SNS */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-primary" />
            <h2 className="text-base font-semibold">SNS</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="instagramUrl">Instagram</Label>
              <Input id="instagramUrl" name="instagramUrl" placeholder="https://instagram.com/..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="xUrl">X (Twitter)</Label>
              <Input id="xUrl" name="xUrl" placeholder="https://x.com/..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tiktokUrl">TikTok</Label>
              <Input id="tiktokUrl" name="tiktokUrl" placeholder="https://tiktok.com/..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="websiteUrl">公式HP等</Label>
              <Input id="websiteUrl" name="websiteUrl" placeholder="https://..." />
            </div>
          </div>
        </section>

        {/* 振込先 */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            <h2 className="text-base font-semibold">振込先情報 *</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="bankName">銀行名 *</Label>
              <Input id="bankName" name="bankName" required />
              {state?.error?.bankName && (
                <p className="text-sm text-destructive">{state.error.bankName[0]}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="bankBranch">支店名 *</Label>
              <Input id="bankBranch" name="bankBranch" required />
              {state?.error?.bankBranch && (
                <p className="text-sm text-destructive">{state.error.bankBranch[0]}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="bankAccountType">種別 *</Label>
              <Select name="bankAccountType">
                <SelectTrigger>
                  <SelectValue placeholder="選択">{(v) => v || "選択"}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="普通" label="普通">普通</SelectItem>
                  <SelectItem value="当座" label="当座">当座</SelectItem>
                </SelectContent>
              </Select>
              {state?.error?.bankAccountType && (
                <p className="text-sm text-destructive">{state.error.bankAccountType[0]}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="bankAccountNumber">口座番号 *</Label>
              <Input id="bankAccountNumber" name="bankAccountNumber" required />
              {state?.error?.bankAccountNumber && (
                <p className="text-sm text-destructive">{state.error.bankAccountNumber[0]}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="bankAccountHolder">口座名義 *</Label>
              <Input id="bankAccountHolder" name="bankAccountHolder" required />
              {state?.error?.bankAccountHolder && (
                <p className="text-sm text-destructive">{state.error.bankAccountHolder[0]}</p>
              )}
            </div>
          </div>
        </section>

        {/* パスワード設定 */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            <h2 className="text-base font-semibold">パスワード設定 *</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            ログインに使用するパスワードを設定してください（8文字以上）
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="password">パスワード *</Label>
              <Input id="password" name="password" type="password" required minLength={8} />
              {state?.error?.password && (
                <p className="text-sm text-destructive">{state.error.password[0]}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="passwordConfirm">パスワード確認 *</Label>
              <Input id="passwordConfirm" name="passwordConfirm" type="password" required minLength={8} />
              {state?.error?.passwordConfirm && (
                <p className="text-sm text-destructive">{state.error.passwordConfirm[0]}</p>
              )}
            </div>
          </div>
        </section>

        <Button type="submit" disabled={isPending} size="lg" className="w-full">
          {isPending ? "登録中..." : "プロフィールを登録してはじめる"}
        </Button>
      </form>
    </div>
  )
}
