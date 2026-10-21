"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { registerTalent } from "@/lib/actions/talent-register"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, X, ImagePlus, Loader2, RefreshCw } from "lucide-react"
import { BTN_PRIMARY, BTN_SECONDARY, FIELD, SELECT_TRIGGER, TEXTAREA } from "@/components/talent/styles"
import { Field, Section, errorAttrs } from "@/components/talent/form-parts"
import { validateTalentTabFields, validateBankTabFields } from "@/lib/validations/talent-register-form"

type ActionResult = { success?: boolean; redirect?: string; error?: Record<string, string[]> } | null
type PhotoSlot = { file: File; preview: string } | null
type TabKey = "talent" | "bank" | "photos"

const PHOTO_SLOTS = [
  { label: "バストアップ", description: "上半身の写真" },
  { label: "全身", description: "全身の写真" },
  { label: "コンポジ用①" },
  { label: "コンポジ用②" },
  { label: "コンポジ用③" },
  { label: "コンポジ用④" },
] as const

const TABS: { key: TabKey; label: string }[] = [
  { key: "talent", label: "タレント情報" },
  { key: "bank", label: "口座情報" },
  { key: "photos", label: "写真" },
]

export function TalentRegisterForm({ priceToken }: { priceToken?: string }) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabKey>("talent")
  const [photos, setPhotos] = useState<PhotoSlot[]>([null, null, null, null, null, null])
  const [uploading, setUploading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [state, setState] = useState<ActionResult>(null)
  const [isPending, setIsPending] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const formRef = useRef<HTMLFormElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const activeSlotRef = useRef<number>(0)
  const submitErrorRef = useRef<HTMLParagraphElement>(null)
  const tabTopRef = useRef<HTMLDivElement>(null)

  const FIELD_ORDER = ["lastName", "firstName", "lastNameKana", "firstNameKana", "email", "phone", "gender", "birthDate", "height", "password", "passwordConfirm"]

  const scrollToFirstError = (errors: Record<string, string[]>) => {
    for (const field of FIELD_ORDER) {
      if (errors[field]?.length) {
        setTimeout(() => {
          document.getElementById(field)?.scrollIntoView({ behavior: "smooth", block: "center" })
        }, 50)
        return
      }
    }
  }

  const scrollToTabTop = () => {
    setTimeout(() => {
      tabTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    }, 50)
  }

  useEffect(() => {
    if (!state?.error) return
    setActiveTab("talent")
    scrollToFirstError(state.error)
  }, [state?.error])

  const getFieldError = (field: string): string | undefined =>
    fieldErrors[field]?.[0] ?? state?.error?.[field]?.[0]

  const validateTalentFields = (): Record<string, string[]> =>
    validateTalentTabFields(Object.fromEntries(new FormData(formRef.current!)))

  const validateBankFields = (): Record<string, string[]> =>
    validateBankTabFields(Object.fromEntries(new FormData(formRef.current!)))

  const TAB_ORDER: TabKey[] = ["talent", "bank", "photos"]

  const validateTab = (tab: TabKey): Record<string, string[]> => {
    if (tab === "talent") return validateTalentFields()
    if (tab === "bank") return validateBankFields()
    return {}
  }

  // タブを直接クリックした場合も、先送りする分はすべて順にバリデーションしてから移動する
  const handleTabClick = (target: TabKey) => {
    const currentIndex = TAB_ORDER.indexOf(activeTab)
    const targetIndex = TAB_ORDER.indexOf(target)

    if (targetIndex <= currentIndex) {
      setActiveTab(target)
      scrollToTabTop()
      return
    }

    for (let i = currentIndex; i < targetIndex; i++) {
      const tab = TAB_ORDER[i]
      const errors = validateTab(tab)
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors)
        setActiveTab(tab)
        scrollToFirstError(errors)
        return
      }
    }
    setFieldErrors({})
    setActiveTab(target)
    scrollToTabTop()
  }

  const handleNextFromTalent = () => handleTabClick("bank")
  const handleNextFromBank = () => handleTabClick("photos")
  const goBackTo = (tab: TabKey) => handleTabClick(tab)

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

  const filledCount = photos.filter(p => p !== null).length

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // アップロード前にクライアントバリデーション（タブをまたいだ最終チェック）
    const talentErrors = validateTalentFields()
    if (Object.keys(talentErrors).length > 0) {
      setFieldErrors(talentErrors)
      setActiveTab("talent")
      scrollToFirstError(talentErrors)
      return
    }

    const bankErrors = validateBankFields()
    if (Object.keys(bankErrors).length > 0) {
      setFieldErrors(bankErrors)
      setActiveTab("bank")
      return
    }

    setFieldErrors({})

    if (filledCount < 6) {
      setSubmitError("写真を6枚以上設定してください")
      setTimeout(() => submitErrorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 50)
      return
    }
    setIsPending(true)
    setSubmitError(null)

    try {
      setUploading(true)
      const photoUrls: string[] = []
      for (const photo of photos) {
        const fd = new FormData()
        // ファイル名に日本語等の非ASCII文字が含まれるとSafariで
        // 「The string did not match the expected pattern.」が発生することがあるため、
        // 拡張子だけ残して安全なファイル名に付け替える
        const ext = photo!.file.name.split(".").pop() || "jpg"
        const safeFile = new File([photo!.file], `photo-${Date.now()}.${ext}`, { type: photo!.file.type })
        fd.append("file", safeFile)
        fd.append("category", "photos")
        const res = await fetch("/api/upload", { method: "POST", body: fd })
        if (!res.ok) throw new Error((await res.json()).error ?? "アップロードに失敗しました")
        const { url } = await res.json()
        photoUrls.push(url)
      }
      setUploading(false)

      const formData = new FormData(formRef.current!)
      formData.set("photoUrls", JSON.stringify(photoUrls))
      const result = await registerTalent(formData)
      if (result?.redirect) {
        router.push(result.redirect)
        return
      }
      setState(result)
    } catch (err) {
      console.error("[Register] submit error:", err)
      setSubmitError(err instanceof Error ? err.message : "エラーが発生しました")
    } finally {
      setIsPending(false)
      setUploading(false)
    }
  }

  if (state?.success) {
    return (
      <div className="flex flex-col items-center rounded-xl border border-neutral-200 px-5 py-12 text-center" role="status">
        <CheckCircle2 className="size-12 text-green-700" aria-hidden="true" />
        <h2 className="mt-4 text-xl font-semibold">登録が完了しました</h2>
        <p className="mt-2 text-sm leading-relaxed text-neutral-500">
          <span className="inline-block">ご登録ありがとうございます。</span>
          <span className="inline-block">担当者より追ってご連絡いたします。</span>
        </p>
      </div>
    )
  }

  // 入力欄の共通の見た目（エラーなら赤枠）
  const input = (id: string) => ({ id, name: id, className: FIELD, ...errorAttrs(id, getFieldError(id)) })
  const urlInput = { inputMode: "url" as const, autoCapitalize: "none", spellCheck: false }

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate className="space-y-5">
      {priceToken && <input type="hidden" name="priceToken" value={priceToken} />}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* タブ（押して切り替え。先へ進むときは入力を確かめてから） */}
      <div ref={tabTopRef} role="tablist" aria-label="入力する内容" className="grid scroll-mt-20 grid-cols-3 gap-1 rounded-xl bg-neutral-100 p-1">
        {TABS.map((tab, i) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.key}
            onClick={() => handleTabClick(tab.key)}
            className={`flex h-10 items-center justify-center gap-1.5 rounded-lg text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950/30 ${
              activeTab === tab.key
                ? "bg-white font-medium text-neutral-950 shadow-sm"
                : "text-neutral-500 hover:text-neutral-950"
            }`}
          >
            <span className="tabular-nums text-xs text-neutral-400">{i + 1}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* タレント情報 */}
      <div className={activeTab === "talent" ? "space-y-5" : "hidden"}>
        <Section title="基本情報">
          <div className="grid grid-cols-2 gap-x-3 gap-y-5 sm:gap-x-4">
            <Field id="lastName" label="姓" required error={getFieldError("lastName")}>
              <input {...input("lastName")} required autoComplete="family-name" />
            </Field>
            <Field id="firstName" label="名" required error={getFieldError("firstName")}>
              <input {...input("firstName")} required autoComplete="given-name" />
            </Field>
            <Field id="lastNameKana" label="セイ" required error={getFieldError("lastNameKana")}>
              <input {...input("lastNameKana")} required />
            </Field>
            <Field id="firstNameKana" label="メイ" required error={getFieldError("firstNameKana")}>
              <input {...input("firstNameKana")} required />
            </Field>
          </div>
          <div className="mt-5 grid grid-cols-1 gap-x-4 gap-y-5 border-t border-neutral-100 pt-5 sm:grid-cols-2">
            <Field id="nameRomaji" label="ローマ字名">
              <input {...input("nameRomaji")} placeholder="例: Taro Yamada" />
            </Field>
            <Field id="category" label="芸能カテゴリ">
              <input {...input("category")} placeholder="例: 俳優、モデル、声優" />
            </Field>
            <Field id="email" label="メールアドレス" required error={getFieldError("email")}>
              <input {...input("email")} type="email" required autoComplete="email" inputMode="email" autoCapitalize="none" spellCheck={false} />
            </Field>
            <Field id="phone" label="電話番号">
              <input {...input("phone")} type="tel" autoComplete="tel" />
            </Field>
            <Field id="gender" label="性別">
              <Select name="gender">
                <SelectTrigger id="gender" className={SELECT_TRIGGER}>
                  <SelectValue placeholder="選択">{(v) => v ? ({ MALE: "男性", FEMALE: "女性", OTHER: "その他" } as Record<string, string>)[v] ?? v : "選択"}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MALE" label="男性">男性</SelectItem>
                  <SelectItem value="FEMALE" label="女性">女性</SelectItem>
                  <SelectItem value="OTHER" label="その他">その他</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field id="birthDate" label="生年月日">
              <input {...input("birthDate")} type="date" className={`${FIELD} appearance-none [&::-webkit-date-and-time-value]:text-left`} />
            </Field>
            <Field id="birthplace" label="出身地">
              <input {...input("birthplace")} placeholder="例: 東京都" />
            </Field>
            <Field id="nearestStation" label="最寄駅">
              <input {...input("nearestStation")} placeholder="例: 渋谷駅" />
            </Field>
            <Field id="address" label="現住所" className="sm:col-span-2">
              <input {...input("address")} />
            </Field>
          </div>
        </Section>

        <Section title="身体情報">
          <div className="grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-5">
            <Field id="height" label="身長 (cm)">
              <input {...input("height")} type="number" />
            </Field>
            <Field id="bust" label="バスト (cm)">
              <input {...input("bust")} type="number" />
            </Field>
            <Field id="waist" label="ウエスト (cm)">
              <input {...input("waist")} type="number" />
            </Field>
            <Field id="hip" label="ヒップ (cm)">
              <input {...input("hip")} type="number" />
            </Field>
            <Field id="shoeSize" label="靴サイズ (cm)">
              <input {...input("shoeSize")} type="number" step="0.5" />
            </Field>
          </div>
        </Section>

        <Section title="スキル・経歴">
          <div className="grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2">
            <Field id="skills" label="特技">
              <input {...input("skills")} placeholder="例: インドネシア語、殺陣" />
            </Field>
            <Field id="hobbies" label="趣味">
              <input {...input("hobbies")} placeholder="例: 釣り、料理、ゴルフ" />
            </Field>
            <Field id="qualifications" label="資格" className="sm:col-span-2">
              <input {...input("qualifications")} placeholder="例: 普通自動車免許、英検2級" />
            </Field>
            <Field id="career" label="経歴" className="sm:col-span-2">
              <textarea id="career" name="career" rows={4} placeholder="出演歴・受賞歴など" className={TEXTAREA} />
            </Field>
            <Field id="representativeWork" label="代表作" className="sm:col-span-2">
              <textarea id="representativeWork" name="representativeWork" rows={2} placeholder="代表的な出演作品" className={TEXTAREA} />
            </Field>
          </div>
        </Section>

        <Section title="SNS情報">
          <div className="grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2">
            <Field id="instagramUrl" label="Instagram URL">
              <input {...input("instagramUrl")} {...urlInput} placeholder="https://instagram.com/..." />
            </Field>
            <Field id="xUrl" label="X (Twitter) URL">
              <input {...input("xUrl")} {...urlInput} placeholder="https://x.com/..." />
            </Field>
            <Field id="tiktokUrl" label="TikTok URL">
              <input {...input("tiktokUrl")} {...urlInput} placeholder="https://tiktok.com/..." />
            </Field>
            <Field id="websiteUrl" label="公式HP等">
              <input {...input("websiteUrl")} {...urlInput} placeholder="https://..." />
            </Field>
          </div>
        </Section>

        <Section title="ログイン情報" description="マイページへのログインに使います。">
          <div className="grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2">
            <Field id="password" label="パスワード" required error={getFieldError("password")}>
              <input {...input("password")} type="password" placeholder="8文字以上" required autoComplete="new-password" />
            </Field>
            <Field id="passwordConfirm" label="パスワード（確認）" required error={getFieldError("passwordConfirm")}>
              <input {...input("passwordConfirm")} type="password" placeholder="もう一度入力" required autoComplete="new-password" />
            </Field>
          </div>
        </Section>

        <div className="flex justify-end pt-1">
          <button type="button" onClick={handleNextFromTalent} className={`${BTN_PRIMARY} w-full sm:w-auto sm:min-w-40`}>
            次へ
            <ChevronRight aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* 口座情報 */}
      <div className={activeTab === "bank" ? "space-y-5" : "hidden"}>
        <Section title="口座情報" description="報酬のお振込先です。あとからマイページの設定でも入力できます。">
          <div className="grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2">
            <Field id="bankName" label="銀行名">
              <input {...input("bankName")} />
            </Field>
            <Field id="bankBranch" label="支店名">
              <input {...input("bankBranch")} />
            </Field>
            <Field id="bankAccountType" label="種別">
              <Select name="bankAccountType">
                <SelectTrigger id="bankAccountType" className={SELECT_TRIGGER}>
                  <SelectValue placeholder="選択">{(v) => v || "選択"}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="普通" label="普通">普通</SelectItem>
                  <SelectItem value="当座" label="当座">当座</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field id="bankAccountNumber" label="口座番号">
              <input {...input("bankAccountNumber")} inputMode="numeric" />
            </Field>
            <Field id="bankAccountHolder" label="口座名義" className="sm:col-span-2">
              <input {...input("bankAccountHolder")} />
            </Field>
          </div>
        </Section>

        <div className="flex gap-3 pt-1 sm:justify-between">
          <button type="button" onClick={() => goBackTo("talent")} className={`${BTN_SECONDARY} flex-1 sm:flex-none sm:min-w-32`}>
            <ChevronLeft aria-hidden="true" />
            戻る
          </button>
          <button type="button" onClick={handleNextFromBank} className={`${BTN_PRIMARY} flex-[2] sm:flex-none sm:min-w-40`}>
            次へ
            <ChevronRight aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* 写真 */}
      <div className={activeTab === "photos" ? "space-y-5" : "hidden"}>
        <Section
          title="宣材写真"
          description={
            <>
              <span className="inline-block">6枚すべて必須です。</span>
              <span className="inline-block">コンポジPDFに使用されます。</span>
            </>
          }
        >
          <p className="mb-4 text-sm text-neutral-500">
            選択済み
            <span className="ml-1.5 font-semibold tabular-nums text-neutral-950">{filledCount} / 6</span> 枚
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {PHOTO_SLOTS.map((slot, i) => (
              <div key={i} className="min-w-0">
                <p className="flex items-center gap-1.5 text-xs font-medium text-neutral-900">
                  {slot.label}
                  <span className="rounded bg-neutral-950 px-1 py-px text-[10px] font-semibold leading-4 text-white">必須</span>
                </p>
                <p className="mt-0.5 h-4 text-[11px] text-neutral-500">{"description" in slot ? slot.description : ""}</p>
                {photos[i] ? (
                  <div className="group relative mt-1.5 aspect-[3/4] overflow-hidden rounded-xl bg-neutral-100 ring-1 ring-neutral-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photos[i]!.preview} alt={slot.label} className="size-full object-cover" />
                    <div className="absolute inset-x-0 bottom-0 flex justify-end gap-1.5 bg-gradient-to-t from-black/60 to-transparent p-2 pt-8">
                      <button type="button" onClick={() => openFilePicker(i)} className="rounded-lg bg-white p-2 text-neutral-950" title="変更" aria-label={`${slot.label}の写真を変更`}>
                        <RefreshCw className="size-4" aria-hidden="true" />
                      </button>
                      <button type="button" onClick={() => removePhoto(i)} className="rounded-lg bg-red-600 p-2 text-white" title="削除" aria-label={`${slot.label}の写真を削除`}>
                        <X className="size-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => openFilePicker(i)}
                    aria-label={`${slot.label}の写真を選ぶ`}
                    className="mt-1.5 flex aspect-[3/4] w-full flex-col items-center justify-center rounded-xl border border-dashed border-neutral-300 bg-neutral-50 text-neutral-400 transition-colors hover:border-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-neutral-950/10"
                  >
                    <ImagePlus className="size-6" aria-hidden="true" />
                    <span className="mt-1.5 text-xs font-medium">選択</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </Section>

        {submitError && (
          <p ref={submitErrorRef} role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {submitError}
          </p>
        )}

        <div className="flex gap-3 pt-1 sm:justify-between">
          <button type="button" onClick={() => goBackTo("bank")} className={`${BTN_SECONDARY} w-12 px-0 sm:w-auto sm:min-w-32 sm:px-4`} aria-label="戻る">
            <ChevronLeft aria-hidden="true" />
            <span className="max-sm:sr-only">戻る</span>
          </button>
          <button type="submit" disabled={isPending || filledCount < 6} className={`${BTN_PRIMARY} flex-1 sm:flex-none sm:min-w-56 disabled:bg-neutral-300 disabled:text-neutral-600 disabled:opacity-100`}>
            {uploading ? (
              <><Loader2 className="animate-spin" aria-hidden="true" />写真アップロード中...</>
            ) : isPending ? "送信中..." : filledCount < 6 ? "写真を6枚以上設定してください" : "登録する"}
          </button>
        </div>
      </div>
    </form>
  )
}
