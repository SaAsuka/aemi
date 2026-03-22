"use client"

import { useActionState } from "react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { setupTalent } from "@/lib/actions/talent-setup"
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

type ActionResult = { success?: boolean; redirect?: string; error?: Record<string, string[]> } | null

async function setupAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  return await setupTalent(formData)
}

export function TalentSetupForm({ email }: { email: string }) {
  const [state, action, isPending] = useActionState(setupAction, null)
  const router = useRouter()

  useEffect(() => {
    if (state?.success && state.redirect) {
      router.push(state.redirect)
    }
  }, [state, router])

  return (
    <form action={action} className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">名前 *</Label>
          <Input id="name" name="name" required />
          {state?.error?.name && (
            <p className="text-sm text-destructive">{state.error.name[0]}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="nameKana">フリガナ *</Label>
          <Input id="nameKana" name="nameKana" required />
          {state?.error?.nameKana && (
            <p className="text-sm text-destructive">{state.error.nameKana[0]}</p>
          )}
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="gender">性別</Label>
          <Select name="gender">
            <SelectTrigger>
              <SelectValue placeholder="選択" />
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
          <Label htmlFor="skills">特技</Label>
          <Input id="skills" name="skills" placeholder="例: インドネシア語、殺陣" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="hobbies">趣味</Label>
          <Input id="hobbies" name="hobbies" placeholder="例: 釣り、料理、ゴルフ" />
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
          <Label htmlFor="qualifications">資格</Label>
          <Input id="qualifications" name="qualifications" placeholder="例: 普通自動車免許、英検2級" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="birthplace">出身地</Label>
          <Input id="birthplace" name="birthplace" placeholder="例: 東京都" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">現住所</Label>
        <Input id="address" name="address" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="career">経歴</Label>
        <Textarea id="career" name="career" rows={4} placeholder="出演歴・受賞歴など" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="representativeWork">代表作</Label>
        <Textarea id="representativeWork" name="representativeWork" rows={2} placeholder="代表的な出演作品" />
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

      <div className="space-y-2">
        <Label htmlFor="nearestStation">最寄駅</Label>
        <Input id="nearestStation" name="nearestStation" placeholder="例: 渋谷駅" />
      </div>

      <h3 className="text-sm font-semibold text-muted-foreground pt-2">振込先情報（任意）</h3>
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
              <SelectValue placeholder="選択" />
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

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "登録中..." : "プロフィールを登録"}
      </Button>
    </form>
  )
}
