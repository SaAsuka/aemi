"use client"

import { startTransition, useActionState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { createTalent, updateTalent } from "@/lib/actions/talent"
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react"
import { BTN_PRIMARY, FIELD, SELECT_TRIGGER, TEXTAREA } from "@/components/talent/styles"
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

// 入力欄の枠（ラベル・必須・サーバーからのエラー）
function Field({
  id,
  label,
  required,
  error,
  className = "",
  children,
}: {
  id: string
  label: string
  required?: boolean
  error?: string[]
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={`min-w-0 ${className}`}>
      <label htmlFor={id} className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-neutral-900">
        {label}
        {required && (
          <span className="rounded bg-neutral-950 px-1.5 py-px text-[10px] font-semibold leading-4 text-white">必須</span>
        )}
      </label>
      {children}
      {error?.[0] && (
        <p id={`${id}-error`} className="mt-1.5 flex items-start gap-1 text-xs text-red-600">
          <AlertCircle className="mt-px size-3.5 shrink-0" aria-hidden="true" />
          {error[0]}
        </p>
      )}
    </div>
  )
}

// フォームの中の区切り（見出し＋項目）
function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="border-t border-neutral-200 pt-6 first:border-t-0 first:pt-0">
      <legend className="float-left mb-4 w-full text-sm font-semibold text-neutral-950">{title}</legend>
      <div className="clear-both grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2">{children}</div>
    </fieldset>
  )
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

  // サーバーの入力チェックのエラー。英語のまま返ってくるもの（数字の形など）は日本語の案内に置き換える
  const err = (name: string): string[] | undefined => {
    const msgs = state?.error?.[name]
    if (!msgs?.length) return undefined
    return /[\u3000-\u9fff]/.test(msgs[0]) ? msgs : ["入力内容を確認してください"]
  }
  const invalid = (name: string) => ({
    "aria-invalid": Boolean(err(name)?.length) || undefined,
    "aria-describedby": err(name)?.length ? `${name}-error` : undefined,
  })
  const errorCount = state?.error ? Object.entries(state.error).filter(([k, v]) => k !== "_form" && v?.length).length : 0

  // 入力チェックはブラウザ標準に頼らずサーバーで行い、エラーは項目の場所に出す（iOS Safari で独自の表示が出ないのを避ける）
  const formRef = useRef<HTMLFormElement>(null)
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    // フォームの action に渡すと送信後に入力欄が空に戻る（React 19）ため、ここで受け取って送る。エラーで戻っても入力が消えない
    e.preventDefault()
    if (isPending) return
    const fd = new FormData(e.currentTarget)
    startTransition(() => action(fd))
  }

  // エラーで戻ったら、最初のエラーの項目へ移動する
  useEffect(() => {
    if (!state?.error || !formRef.current) return
    const first = formRef.current.querySelector<HTMLElement>("[aria-invalid=true]")
    first?.scrollIntoView({ behavior: "smooth", block: "center" })
    first?.focus({ preventScroll: true })
  }, [state])

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate className="space-y-6">
      {(errorCount > 0 || state?.error?._form) && (
        <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <p>
            {state?.error?._form?.[0] ??
              `入力内容に確認が必要な項目が${errorCount}件あります。赤字の項目を直してから、もう一度保存してください。`}
          </p>
        </div>
      )}
      <Group title="基本情報">
        <Field id="lastName" label="姓" required error={err("lastName")}>
          <input id="lastName" name="lastName" defaultValue={talent?.lastName ?? ""} required autoComplete="family-name" className={FIELD} {...invalid("lastName")} />
        </Field>
        <Field id="firstName" label="名" required error={err("firstName")}>
          <input id="firstName" name="firstName" defaultValue={talent?.firstName ?? ""} required autoComplete="given-name" className={FIELD} {...invalid("firstName")} />
        </Field>
        <Field id="lastNameKana" label="セイ" required error={err("lastNameKana")}>
          <input id="lastNameKana" name="lastNameKana" defaultValue={talent?.lastNameKana ?? ""} required className={FIELD} {...invalid("lastNameKana")} />
        </Field>
        <Field id="firstNameKana" label="メイ" required error={err("firstNameKana")}>
          <input id="firstNameKana" name="firstNameKana" defaultValue={talent?.firstNameKana ?? ""} required className={FIELD} {...invalid("firstNameKana")} />
        </Field>
        <Field id="stageName" label="芸名">
          <input id="stageName" name="stageName" defaultValue={talent?.stageName ?? ""} placeholder="コンポジPDFに表記される名前" className={FIELD} />
        </Field>
        <Field id="nameRomaji" label="ローマ字名">
          <input id="nameRomaji" name="nameRomaji" defaultValue={talent?.nameRomaji ?? ""} placeholder="例: Taro Yamada" className={FIELD} />
        </Field>
        <Field id="email" label="メールアドレス" required error={err("email")}>
          <input id="email" name="email" type="email" defaultValue={talent?.email ?? ""} autoComplete="email" inputMode="email" autoCapitalize="none" spellCheck={false} className={FIELD} {...invalid("email")} />
        </Field>
        <Field id="phone" label="電話番号">
          <input id="phone" name="phone" type="tel" defaultValue={talent?.phone ?? ""} autoComplete="tel" className={FIELD} />
        </Field>
        <Field id="category" label="芸能カテゴリ">
          <input id="category" name="category" defaultValue={talent?.category ?? ""} placeholder="例: 俳優、モデル、声優" className={FIELD} />
        </Field>
        <Field id="gender" label="性別">
          <Select name="gender" defaultValue={talent?.gender ?? ""}>
            <SelectTrigger id="gender" className={SELECT_TRIGGER}>
              <SelectValue placeholder="選択">{(v) => v ? GENDER_LABELS[v] ?? v : "選択"}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MALE" label="男性">男性</SelectItem>
              <SelectItem value="FEMALE" label="女性">女性</SelectItem>
              <SelectItem value="OTHER" label="その他">その他</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field id="birthDate" label="生年月日">
          <input
            id="birthDate"
            name="birthDate"
            type="date"
            defaultValue={
              talent?.birthDate
                ? new Date(talent.birthDate).toISOString().split("T")[0]
                : ""
            }
            className={`${FIELD} appearance-none [&::-webkit-date-and-time-value]:text-left`}
          />
        </Field>
        <Field id="birthplace" label="出身地">
          <input id="birthplace" name="birthplace" defaultValue={talent?.birthplace ?? ""} placeholder="例: 東京都" className={FIELD} />
        </Field>
        <Field id="nearestStation" label="最寄駅">
          <input id="nearestStation" name="nearestStation" defaultValue={talent?.nearestStation ?? ""} placeholder="例: 渋谷駅" className={FIELD} />
        </Field>
        <Field id="address" label="現住所" className="sm:col-span-2">
          <input id="address" name="address" defaultValue={talent?.address ?? ""} className={FIELD} />
        </Field>
        {isAdmin && (
          <Field id="lineUserId" label="LINE ユーザーID">
            <input id="lineUserId" name="lineUserId" defaultValue={talent?.lineUserId ?? ""} className={FIELD} />
          </Field>
        )}
        {isAdmin && (
          <Field id="status" label="ステータス">
            <Select name="status" defaultValue={talent?.status ?? "ACTIVE"}>
              <SelectTrigger id="status" className={SELECT_TRIGGER}>
                <SelectValue>{(v) => TALENT_STATUS_LABELS[v] ?? v}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE" label="アクティブ">アクティブ</SelectItem>
                <SelectItem value="INACTIVE" label="非アクティブ">非アクティブ</SelectItem>
                <SelectItem value="WITHDRAWN" label="退会">退会</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        )}
      </Group>

      <Group title="身体情報">
        <div className="grid grid-cols-3 gap-x-3 gap-y-5 sm:col-span-2 sm:grid-cols-5">
          <Field id="height" label="身長 (cm)" error={err("height")}>
            <input id="height" name="height" type="number" defaultValue={talent?.height ?? ""} className={FIELD} {...invalid("height")} />
          </Field>
          <Field id="bust" label="バスト (cm)" error={err("bust")}>
            <input id="bust" name="bust" type="number" defaultValue={talent?.bust ?? ""} className={FIELD} {...invalid("bust")} />
          </Field>
          <Field id="waist" label="ウエスト (cm)" error={err("waist")}>
            <input id="waist" name="waist" type="number" defaultValue={talent?.waist ?? ""} className={FIELD} {...invalid("waist")} />
          </Field>
          <Field id="hip" label="ヒップ (cm)" error={err("hip")}>
            <input id="hip" name="hip" type="number" defaultValue={talent?.hip ?? ""} className={FIELD} {...invalid("hip")} />
          </Field>
          <Field id="shoeSize" label="靴サイズ (cm)" error={err("shoeSize")}>
            <input id="shoeSize" name="shoeSize" type="number" step="0.5" defaultValue={talent?.shoeSize ?? ""} className={FIELD} {...invalid("shoeSize")} />
          </Field>
        </div>
      </Group>

      <Group title="スキル・経歴">
        <Field id="skills" label="特技">
          <input id="skills" name="skills" defaultValue={talent?.skills ?? ""} placeholder="例: インドネシア語、殺陣" className={FIELD} />
        </Field>
        <Field id="hobbies" label="趣味">
          <input id="hobbies" name="hobbies" defaultValue={talent?.hobbies ?? ""} placeholder="例: 釣り、料理、ゴルフ" className={FIELD} />
        </Field>
        <Field id="qualifications" label="資格" className="sm:col-span-2">
          <input id="qualifications" name="qualifications" defaultValue={talent?.qualifications ?? ""} placeholder="例: 普通自動車免許、英検2級" className={FIELD} />
        </Field>
        <Field id="career" label="経歴" className="sm:col-span-2">
          <textarea id="career" name="career" rows={6} defaultValue={talent?.career ?? ""} placeholder="出演歴・受賞歴など" className={TEXTAREA} />
        </Field>
        <Field id="representativeWork" label="代表作" className="sm:col-span-2">
          <textarea id="representativeWork" name="representativeWork" rows={3} defaultValue={talent?.representativeWork ?? ""} placeholder="代表的な出演作品" className={TEXTAREA} />
        </Field>
      </Group>

      <Group title="SNS情報">
        <Field id="instagramUrl" label="Instagram URL">
          <input id="instagramUrl" name="instagramUrl" defaultValue={getSocialUrl(talent?.socialLinks, "INSTAGRAM")} placeholder="https://instagram.com/..." inputMode="url" autoCapitalize="none" spellCheck={false} className={FIELD} />
        </Field>
        <Field id="xUrl" label="X (Twitter) URL">
          <input id="xUrl" name="xUrl" defaultValue={getSocialUrl(talent?.socialLinks, "X")} placeholder="https://x.com/..." inputMode="url" autoCapitalize="none" spellCheck={false} className={FIELD} />
        </Field>
        <Field id="tiktokUrl" label="TikTok URL">
          <input id="tiktokUrl" name="tiktokUrl" defaultValue={getSocialUrl(talent?.socialLinks, "TIKTOK")} placeholder="https://tiktok.com/..." inputMode="url" autoCapitalize="none" spellCheck={false} className={FIELD} />
        </Field>
        <Field id="websiteUrl" label="公式HP等">
          <input id="websiteUrl" name="websiteUrl" defaultValue={getSocialUrl(talent?.socialLinks, "WEBSITE")} placeholder="https://..." inputMode="url" autoCapitalize="none" spellCheck={false} className={FIELD} />
        </Field>
      </Group>

      <Group title="振込先情報">
        <Field id="bankName" label="銀行名" required={bankRequired} error={err("bankName")}>
          <input id="bankName" name="bankName" defaultValue={talent?.bankAccount?.bankName ?? ""} required={bankRequired} className={FIELD} {...invalid("bankName")} />
        </Field>
        <Field id="bankBranch" label="支店名" required={bankRequired} error={err("bankBranch")}>
          <input id="bankBranch" name="bankBranch" defaultValue={talent?.bankAccount?.branchName ?? ""} required={bankRequired} className={FIELD} {...invalid("bankBranch")} />
        </Field>
        <Field id="bankAccountType" label="種別" required={bankRequired} error={err("bankAccountType")}>
          <Select name="bankAccountType" defaultValue={talent?.bankAccount?.accountType ?? ""}>
            <SelectTrigger id="bankAccountType" className={SELECT_TRIGGER} {...invalid("bankAccountType")}>
              <SelectValue placeholder="選択">{(v) => v || "選択"}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="普通" label="普通">普通</SelectItem>
              <SelectItem value="当座" label="当座">当座</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field id="bankAccountNumber" label="口座番号" required={bankRequired} error={err("bankAccountNumber")}>
          <input id="bankAccountNumber" name="bankAccountNumber" defaultValue={talent?.bankAccount?.accountNumber ?? ""} required={bankRequired} inputMode="numeric" className={FIELD} {...invalid("bankAccountNumber")} />
        </Field>
        <Field id="bankAccountHolder" label="口座名義" required={bankRequired} error={err("bankAccountHolder")} className="sm:col-span-2">
          <input id="bankAccountHolder" name="bankAccountHolder" defaultValue={talent?.bankAccount?.accountHolder ?? ""} required={bankRequired} className={FIELD} {...invalid("bankAccountHolder")} />
        </Field>
      </Group>

      {isAdmin && (
        <Group title="備考">
          <Field id="note" label="備考" className="sm:col-span-2">
            <textarea id="note" name="note" defaultValue={talent?.note ?? ""} className={TEXTAREA} />
          </Field>
        </Group>
      )}

      <div className="flex flex-col-reverse items-stretch gap-3 border-t border-neutral-200 pt-6 sm:flex-row sm:items-center sm:justify-end">
        {state?.success && !isPending && (
          <p role="status" className="flex items-center justify-center gap-1.5 text-sm text-green-700">
            <CheckCircle2 className="size-4" aria-hidden="true" />
            保存しました
          </p>
        )}
        <button type="submit" disabled={isPending} className={`${BTN_PRIMARY} sm:min-w-40`}>
          {isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
          {isPending ? "保存中..." : talent ? "更新" : "登録"}
        </button>
      </div>
    </form>
  )
}
