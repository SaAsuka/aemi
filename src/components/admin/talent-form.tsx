"use client"

import { useActionState } from "react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { createTalent, updateTalent } from "@/lib/actions/talent"
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
import type { Talent, TalentBankAccount, TalentSocialLink } from "@/generated/prisma/client"
import { GENDER_LABELS, TALENT_STATUS_LABELS } from "@/types"

type ActionResult = { success?: boolean; error?: Record<string, string[]> } | null

type TalentWithRelations = Talent & {
  bankAccount?: TalentBankAccount | null
  socialLinks?: TalentSocialLink[]
}

type TalentFormProps = {
  talent?: TalentWithRelations
  onSuccess?: () => void
  mode?: "admin" | "talent"
  customAction?: (formData: FormData) => Promise<ActionResult>
}

function getSocialUrl(links: TalentSocialLink[] | undefined, platform: string): string {
  return links?.find((l) => l.platform === platform)?.url ?? ""
}

function talentAction(talent?: TalentWithRelations, customAction?: (formData: FormData) => Promise<ActionResult>) {
  return async (_prev: ActionResult, formData: FormData): Promise<ActionResult> => {
    if (customAction) return await customAction(formData)
    if (talent) return await updateTalent(talent.id, formData)
    return await createTalent(formData)
  }
}

export function TalentForm({ talent, onSuccess, mode = "admin", customAction }: TalentFormProps) {
  const [state, action, isPending] = useActionState(talentAction(talent, customAction), null)
  const isAdmin = mode === "admin"
  const isTalent = mode === "talent"
  const router = useRouter()

  useEffect(() => {
    if (state?.success && !talent) {
      router.push("/admin/talents")
    }
    if (state?.success && talent?.resume) {
      fetch(`/api/talents/${talent.id}/composite`).catch(() => {})
    }
    if (state?.success) {
      onSuccess?.()
    }
  }, [state, talent, router, onSuccess])

  const bankRequired = isTalent

  return (
    <form action={action} className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="lastName">姓 *</Label>
          <Input id="lastName" name="lastName" defaultValue={talent?.lastName ?? ""} required />
          {state?.error?.lastName && (
            <p className="text-sm text-destructive">{state.error.lastName[0]}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="firstName">名 *</Label>
          <Input id="firstName" name="firstName" defaultValue={talent?.firstName ?? ""} required />
          {state?.error?.firstName && (
            <p className="text-sm text-destructive">{state.error.firstName[0]}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="lastNameKana">セイ *</Label>
          <Input id="lastNameKana" name="lastNameKana" defaultValue={talent?.lastNameKana ?? ""} required />
          {state?.error?.lastNameKana && (
            <p className="text-sm text-destructive">{state.error.lastNameKana[0]}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="firstNameKana">メイ *</Label>
          <Input id="firstNameKana" name="firstNameKana" defaultValue={talent?.firstNameKana ?? ""} required />
          {state?.error?.firstNameKana && (
            <p className="text-sm text-destructive">{state.error.firstNameKana[0]}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="stageName">芸名</Label>
          <Input
            id="stageName"
            name="stageName"
            defaultValue={talent?.stageName ?? ""}
            placeholder="コンポジPDFに表記される名前"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="email">メールアドレス</Label>
          <Input id="email" name="email" type="email" defaultValue={talent?.email ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">電話番号</Label>
          <Input id="phone" name="phone" defaultValue={talent?.phone ?? ""} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="gender">性別</Label>
          <Select name="gender" defaultValue={talent?.gender ?? ""}>
            <SelectTrigger>
              <SelectValue placeholder="選択">{(v) => v ? GENDER_LABELS[v] ?? v : "選択"}</SelectValue>
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
          <Input
            id="birthDate"
            name="birthDate"
            type="date"
            defaultValue={
              talent?.birthDate
                ? new Date(talent.birthDate).toISOString().split("T")[0]
                : ""
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="height">身長 (cm)</Label>
          <Input
            id="height"
            name="height"
            type="number"
            defaultValue={talent?.height ?? ""}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor="bust">バスト (cm)</Label>
          <Input
            id="bust"
            name="bust"
            type="number"
            defaultValue={talent?.bust ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="waist">ウエスト (cm)</Label>
          <Input
            id="waist"
            name="waist"
            type="number"
            defaultValue={talent?.waist ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="hip">ヒップ (cm)</Label>
          <Input
            id="hip"
            name="hip"
            type="number"
            defaultValue={talent?.hip ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="shoeSize">靴サイズ (cm)</Label>
          <Input
            id="shoeSize"
            name="shoeSize"
            type="number"
            step="0.5"
            defaultValue={talent?.shoeSize ?? ""}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="skills">特技</Label>
          <Input
            id="skills"
            name="skills"
            defaultValue={talent?.skills ?? ""}
            placeholder="例: インドネシア語、殺陣"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="hobbies">趣味</Label>
          <Input
            id="hobbies"
            name="hobbies"
            defaultValue={talent?.hobbies ?? ""}
            placeholder="例: 釣り、料理、ゴルフ"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="nameRomaji">ローマ字名</Label>
          <Input
            id="nameRomaji"
            name="nameRomaji"
            defaultValue={talent?.nameRomaji ?? ""}
            placeholder="例: Taro Yamada"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">芸能カテゴリ</Label>
          <Input
            id="category"
            name="category"
            defaultValue={talent?.category ?? ""}
            placeholder="例: 俳優、モデル、声優"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="qualifications">資格</Label>
          <Input
            id="qualifications"
            name="qualifications"
            defaultValue={talent?.qualifications ?? ""}
            placeholder="例: 普通自動車免許、英検2級"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="birthplace">出身地</Label>
          <Input
            id="birthplace"
            name="birthplace"
            defaultValue={talent?.birthplace ?? ""}
            placeholder="例: 東京都"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">現住所</Label>
        <Input
          id="address"
          name="address"
          defaultValue={talent?.address ?? ""}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="career">経歴</Label>
        <Textarea
          id="career"
          name="career"
          rows={6}
          defaultValue={talent?.career ?? ""}
          placeholder="出演歴・受賞歴など"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="representativeWork">代表作</Label>
        <Textarea
          id="representativeWork"
          name="representativeWork"
          rows={3}
          defaultValue={talent?.representativeWork ?? ""}
          placeholder="代表的な出演作品"
        />
      </div>

      <h3 className="text-sm font-semibold text-muted-foreground pt-2">SNS情報</h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="instagramUrl">Instagram URL</Label>
          <Input
            id="instagramUrl"
            name="instagramUrl"
            defaultValue={getSocialUrl(talent?.socialLinks, "INSTAGRAM")}
            placeholder="https://instagram.com/..."
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="xUrl">X (Twitter) URL</Label>
          <Input
            id="xUrl"
            name="xUrl"
            defaultValue={getSocialUrl(talent?.socialLinks, "X")}
            placeholder="https://x.com/..."
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tiktokUrl">TikTok URL</Label>
          <Input
            id="tiktokUrl"
            name="tiktokUrl"
            defaultValue={getSocialUrl(talent?.socialLinks, "TIKTOK")}
            placeholder="https://tiktok.com/..."
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="websiteUrl">公式HP等</Label>
          <Input
            id="websiteUrl"
            name="websiteUrl"
            defaultValue={getSocialUrl(talent?.socialLinks, "WEBSITE")}
            placeholder="https://..."
          />
        </div>
      </div>

      <div className={`grid grid-cols-1 gap-4 ${isAdmin ? "sm:grid-cols-3" : ""}`}>
        <div className="space-y-2">
          <Label htmlFor="nearestStation">最寄駅</Label>
          <Input
            id="nearestStation"
            name="nearestStation"
            defaultValue={talent?.nearestStation ?? ""}
            placeholder="例: 渋谷駅"
          />
        </div>
        {isAdmin && (
          <div className="space-y-2">
            <Label htmlFor="lineUserId">LINE ユーザーID</Label>
            <Input
              id="lineUserId"
              name="lineUserId"
              defaultValue={talent?.lineUserId ?? ""}
            />
          </div>
        )}
        {isAdmin && (
          <div className="space-y-2">
            <Label htmlFor="status">ステータス</Label>
            <Select name="status" defaultValue={talent?.status ?? "ACTIVE"}>
              <SelectTrigger>
                <SelectValue>{(v) => TALENT_STATUS_LABELS[v] ?? v}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE" label="アクティブ">アクティブ</SelectItem>
                <SelectItem value="INACTIVE" label="非アクティブ">非アクティブ</SelectItem>
                <SelectItem value="WITHDRAWN" label="退会">退会</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <h3 className="text-sm font-semibold text-muted-foreground pt-2">
        振込先情報{bankRequired && " *"}
      </h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="bankName">銀行名{bankRequired && " *"}</Label>
          <Input
            id="bankName"
            name="bankName"
            defaultValue={talent?.bankAccount?.bankName ?? ""}
            required={bankRequired}
          />
          {state?.error?.bankName && (
            <p className="text-sm text-destructive">{state.error.bankName[0]}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="bankBranch">支店名{bankRequired && " *"}</Label>
          <Input
            id="bankBranch"
            name="bankBranch"
            defaultValue={talent?.bankAccount?.branchName ?? ""}
            required={bankRequired}
          />
          {state?.error?.bankBranch && (
            <p className="text-sm text-destructive">{state.error.bankBranch[0]}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="bankAccountType">種別{bankRequired && " *"}</Label>
          <Select name="bankAccountType" defaultValue={talent?.bankAccount?.accountType ?? ""}>
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
          <Label htmlFor="bankAccountNumber">口座番号{bankRequired && " *"}</Label>
          <Input
            id="bankAccountNumber"
            name="bankAccountNumber"
            defaultValue={talent?.bankAccount?.accountNumber ?? ""}
            required={bankRequired}
          />
          {state?.error?.bankAccountNumber && (
            <p className="text-sm text-destructive">{state.error.bankAccountNumber[0]}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="bankAccountHolder">口座名義{bankRequired && " *"}</Label>
          <Input
            id="bankAccountHolder"
            name="bankAccountHolder"
            defaultValue={talent?.bankAccount?.accountHolder ?? ""}
            required={bankRequired}
          />
          {state?.error?.bankAccountHolder && (
            <p className="text-sm text-destructive">{state.error.bankAccountHolder[0]}</p>
          )}
        </div>
      </div>

      {isAdmin && (
        <div className="space-y-2">
          <Label htmlFor="note">備考</Label>
          <Textarea id="note" name="note" defaultValue={talent?.note ?? ""} />
        </div>
      )}

      <Button type="submit" disabled={isPending}>
        {isPending ? "保存中..." : talent ? "更新" : "登録"}
      </Button>
    </form>
  )
}
