"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState, useCallback, useRef } from "react"
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
import { Plus, Loader2, Trash2, GripVertical, Camera, User, Ruler, Share2, CreditCard, Lock, ChevronLeft, ChevronRight, Check } from "lucide-react"
import type { TalentPhoto } from "@/generated/prisma/client"

const STORAGE_KEY = "vozel_setup_draft"
const TOTAL_STEPS = 4

type ActionResult = { success?: boolean; redirect?: string; error?: Record<string, string[]> } | null

function photoLabel(idx: number): string {
  if (idx === 0) return "バストアップ"
  if (idx === 1) return "全身"
  return `#${idx + 1}`
}

// --- ステッププログレスバー ---
function StepProgressBar({ current, total }: { current: number; total: number }) {
  const labels = ["写真・基本情報", "身体・スキル", "SNS・振込先", "パスワード"]
  return (
    <div className="flex items-center gap-0 mb-8">
      {labels.map((label, idx) => {
        const step = idx + 1
        const isCompleted = current > step
        const isCurrent = current === step
        const isLast = idx === labels.length - 1
        return (
          <div key={label} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium ${
                  isCompleted
                    ? "bg-primary text-primary-foreground"
                    : isCurrent
                    ? "bg-primary text-primary-foreground ring-2 ring-primary/30 ring-offset-2"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {isCompleted ? <Check className="h-4 w-4" /> : step}
              </div>
              <span className={`text-[10px] sm:text-xs mt-1.5 text-center leading-tight ${isCurrent || isCompleted ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                {label}
              </span>
            </div>
            {!isLast && (
              <div className={`h-0.5 flex-1 mx-2 ${current > step ? "bg-primary" : "bg-muted"}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// --- 写真セクション ---
function SetupPhotos({ talentId, photos: initialPhotos }: { talentId: string; photos: TalentPhoto[] }) {
  const [photos, setPhotos] = useState(initialPhotos)
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})
  const [dragIdx, setDragIdx] = useState<number | null>(null)

  const uploading = Object.keys(uploadProgress).length > 0

  const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files?.length) return
    try {
      for (const file of Array.from(files)) {
        setUploadProgress((prev) => ({ ...prev, [file.name]: 0 }))
        const blob = await upload(file.name, file, {
          access: "private",
          handleUploadUrl: "/api/upload",
          onUploadProgress: ({ percentage }) => {
            setUploadProgress((prev) => ({ ...prev, [file.name]: percentage }))
          },
        })
        setUploadProgress((prev) => {
          const next = { ...prev }
          delete next[file.name]
          return next
        })
        await addTalentPhoto(talentId, blob.url)
      }
      window.location.reload()
    } catch {
      setUploadProgress({})
      alert("アップロードに失敗しました")
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{photos.length} 枚</span>
          {photos.length >= 6 ? (
            <span className="text-xs text-green-600 font-medium">コンポジOK（上位6枚を使用）</span>
          ) : (
            <span className="text-xs text-amber-600">コンポジPDF生成には6枚以上必要です</span>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading}
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

      {Object.entries(uploadProgress).map(([name, pct]) => (
        <div key={name} className="space-y-1">
          <p className="text-xs text-muted-foreground truncate">{name}</p>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      ))}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {photos.map((photo, idx) => (
          <div
            key={photo.id}
            draggable
            onDragStart={() => handleDragStart(idx)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(idx)}
            className={`relative group rounded-xl overflow-hidden border-2 transition-all ${idx < 6 ? "border-primary/30" : "border-border"} ${dragIdx === idx ? "opacity-50 scale-95" : "hover:border-primary/30"}`}
          >
            <img src={blobProxyUrl(photo.url)} alt={photoLabel(idx)} className="w-full aspect-[3/4] object-cover" />
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-2">
              <span className="text-white text-xs font-medium">
                {photoLabel(idx)}
                {idx < 6 && <span className="ml-1 text-[10px] opacity-75">コンポジ</span>}
              </span>
            </div>
            <div className="absolute top-1.5 right-1.5 flex gap-1">
              <button type="button" className="bg-black/60 text-white p-2 rounded-lg cursor-grab">
                <GripVertical className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => handleDelete(photo.id)} className="bg-red-500/80 text-white p-2 rounded-lg hover:bg-red-500">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// --- フィールドエラー表示（リアルタイム + サーバー） ---
function FieldError({ name, clientErrors, serverErrors }: {
  name: string
  clientErrors: Record<string, string | undefined>
  serverErrors?: Record<string, string[]> | null
}) {
  const clientErr = clientErrors[name]
  const serverErr = serverErrors?.[name]?.[0]
  const msg = clientErr || serverErr
  if (!msg) return null
  return <p className="text-sm text-destructive">{msg}</p>
}

// --- メインフォーム ---
export function TalentSetupForm({ email, talentId, photos }: { email: string; talentId: string; photos: TalentPhoto[] }) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | undefined>>({})
  const [serverErrors, setServerErrors] = useState<Record<string, string[]> | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [restored, setRestored] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  // ブラウザ戻るボタンでステップを戻す
  useEffect(() => {
    const handler = (e: PopStateEvent) => {
      const s = e.state?.setupStep as number | undefined
      if (s && s >= 1 && s <= TOTAL_STEPS) {
        setStep(s)
      }
    }
    window.addEventListener("popstate", handler)
    return () => window.removeEventListener("popstate", handler)
  }, [])

  // セッションストレージからの復元
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY)
      if (!saved || !formRef.current) return
      const data = JSON.parse(saved) as Record<string, string>
      const form = formRef.current
      for (const [key, value] of Object.entries(data)) {
        const el = form.elements.namedItem(key)
        if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
          el.value = value
        }
      }
      if (data._step) setStep(Number(data._step))
      setRestored(true)
      setTimeout(() => setRestored(false), 3000)
    } catch { /* ignore */ }
  }, [])

  // 自動保存（debounce 1秒）
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null)
  const saveDraft = useCallback(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(() => {
      if (!formRef.current) return
      const data = Object.fromEntries(new FormData(formRef.current))
      const draft: Record<string, string> = { _step: String(step) }
      for (const [k, v] of Object.entries(data)) {
        if (typeof v === "string") draft[k] = v
      }
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft))
    }, 1000)
  }, [step])

  // 離脱防止
  useEffect(() => {
    if (!isDirty) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
    }
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [isDirty])

  const handleChange = useCallback(() => {
    setIsDirty(true)
    saveDraft()
  }, [saveDraft])

  // リアルタイムバリデーション（onBlur）— フィールド単体で検証
  const validateField = useCallback((name: string, value: string) => {
    const rules: Record<string, (v: string) => string | null> = {
      lastName: (v) => v.trim() ? null : "姓は必須です",
      firstName: (v) => v.trim() ? null : "名は必須です",
      lastNameKana: (v) => v.trim() ? null : "セイは必須です",
      firstNameKana: (v) => v.trim() ? null : "メイは必須です",
      bankName: (v) => v.trim() ? null : "銀行名は必須です",
      bankBranch: (v) => v.trim() ? null : "支店名は必須です",
      bankAccountNumber: (v) => v.trim() ? null : "口座番号は必須です",
      bankAccountHolder: (v) => v.trim() ? null : "口座名義は必須です",
      password: (v) => v.length >= 8 ? null : "パスワードは8文字以上で入力してください",
    }
    const rule = rules[name]
    if (!rule) return

    const error = rule(value)
    setFieldErrors((prev) => {
      if (error) return { ...prev, [name]: error }
      if (!prev[name]) return prev
      const next = { ...prev }
      delete next[name]
      return next
    })
  }, [])

  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    if (name && value) validateField(name, value)
  }, [validateField])

  // ステップ内の必須フィールドバリデーション
  const validateCurrentStep = useCallback((): boolean => {
    if (!formRef.current) return false
    const form = formRef.current
    const requiredByStep: Record<number, string[]> = {
      1: ["lastName", "firstName", "lastNameKana", "firstNameKana"],
      2: [],
      3: ["bankName", "bankBranch", "bankAccountType", "bankAccountNumber", "bankAccountHolder"],
      4: ["password", "passwordConfirm"],
    }
    const fields = requiredByStep[step] ?? []
    const errors: Record<string, string | undefined> = {}
    let valid = true

    for (const name of fields) {
      const el = form.elements.namedItem(name)
      const value = el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement ? el.value : ""
      if (!value.trim()) {
        errors[name] = "この項目は必須です"
        valid = false
      }
    }

    if (step === 4) {
      const pw = (form.elements.namedItem("password") as HTMLInputElement)?.value ?? ""
      const confirm = (form.elements.namedItem("passwordConfirm") as HTMLInputElement)?.value ?? ""
      if (pw && pw.length < 8) {
        errors["password"] = "パスワードは8文字以上で入力してください"
        valid = false
      }
      if (pw && confirm && pw !== confirm) {
        errors["passwordConfirm"] = "パスワードが一致しません"
        valid = false
      }
    }

    const cleared: Record<string, string | undefined> = {}
    for (const name of fields) {
      if (!errors[name]) cleared[name] = undefined
    }
    if (step === 4) {
      if (!errors["password"]) cleared["password"] = undefined
      if (!errors["passwordConfirm"]) cleared["passwordConfirm"] = undefined
    }
    setFieldErrors((prev) => {
      const next = { ...prev }
      for (const key of Object.keys(cleared)) delete next[key]
      return { ...next, ...errors }
    })
    return valid
  }, [step])

  const goNext = useCallback(() => {
    if (validateCurrentStep()) {
      saveDraft()
      const next = Math.min(step + 1, TOTAL_STEPS)
      setStep(next)
      history.pushState({ setupStep: next }, "")
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }, [validateCurrentStep, saveDraft, step])

  const goPrev = useCallback(() => {
    const prev = Math.max(step - 1, 1)
    setStep(prev)
    history.pushState({ setupStep: prev }, "")
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [step])

  const FIELD_TO_STEP: Record<string, number> = {
    lastName: 1, firstName: 1, lastNameKana: 1, firstNameKana: 1,
    bankName: 3, bankBranch: 3, bankAccountType: 3, bankAccountNumber: 3, bankAccountHolder: 3,
    password: 4, passwordConfirm: 4,
  }

  const navigateToErrorStep = useCallback((errors: Record<string, string[]>) => {
    let minStep = TOTAL_STEPS
    for (const key of Object.keys(errors)) {
      const s = FIELD_TO_STEP[key]
      if (s && s < minStep) minStep = s
    }
    setStep(minStep)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [])

  const validateAllSteps = useCallback((): boolean => {
    if (!formRef.current) return false
    const form = formRef.current
    const allRequired: Record<number, string[]> = {
      1: ["lastName", "firstName", "lastNameKana", "firstNameKana"],
      3: ["bankName", "bankBranch", "bankAccountType", "bankAccountNumber", "bankAccountHolder"],
      4: ["password", "passwordConfirm"],
    }
    const errors: Record<string, string | undefined> = {}
    let firstErrorStep: number | null = null

    for (const [stepStr, fields] of Object.entries(allRequired)) {
      const s = Number(stepStr)
      for (const name of fields) {
        const el = form.elements.namedItem(name)
        const value = el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement ? el.value : ""
        if (!value.trim()) {
          errors[name] = "この項目は必須です"
          if (!firstErrorStep) firstErrorStep = s
        }
      }
    }

    const pw = (form.elements.namedItem("password") as HTMLInputElement)?.value ?? ""
    const confirm = (form.elements.namedItem("passwordConfirm") as HTMLInputElement)?.value ?? ""
    if (pw && pw.length < 8) {
      errors["password"] = "パスワードは8文字以上で入力してください"
      if (!firstErrorStep) firstErrorStep = 4
    }
    if (pw && confirm && pw !== confirm) {
      errors["passwordConfirm"] = "パスワードが一致しません"
      if (!firstErrorStep) firstErrorStep = 4
    }

    setFieldErrors(errors)
    if (firstErrorStep) {
      setStep(firstErrorStep)
      window.scrollTo({ top: 0, behavior: "smooth" })
      return false
    }
    return true
  }, [])

  const handleSubmit = useCallback(async () => {
    if (!formRef.current) return
    if (!validateAllSteps()) return

    setIsSubmitting(true)
    setServerErrors(null)
    try {
      const formData = new FormData(formRef.current)

      // Base UI Selectの値がFormDataに含まれない場合を補完
      const selects = formRef.current.querySelectorAll("[data-slot='select-trigger']")
      selects.forEach((trigger) => {
        const root = trigger.closest("[data-select]") || trigger.parentElement
        const hiddenInput = root?.querySelector("input[type='hidden']") as HTMLInputElement | null
        if (hiddenInput?.name && hiddenInput.value && !formData.get(hiddenInput.name)) {
          formData.set(hiddenInput.name, hiddenInput.value)
        }
      })

      const result = await setupTalent(formData)

      if (result?.success && result.redirect) {
        sessionStorage.removeItem(STORAGE_KEY)
        router.push(result.redirect)
        return
      }
      if (result?.error) {
        setServerErrors(result.error)
        navigateToErrorStep(result.error)
      }
    } catch (err) {
      console.error("セットアップ送信エラー:", err)
      setServerErrors({ _form: ["送信中にエラーが発生しました。もう一度お試しください。"] })
    } finally {
      setIsSubmitting(false)
    }
  }, [validateAllSteps, navigateToErrorStep, router])

  return (
    <div className="space-y-6">
      <StepProgressBar current={step} total={TOTAL_STEPS} />

      {restored && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
          前回の入力データを復元しました
        </div>
      )}

      {serverErrors?._form && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {serverErrors._form[0]}
        </div>
      )}

      {/* ステップ1: 写真・基本情報 */}
      {step === 1 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            <h2 className="text-base font-semibold">宣材写真</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            写真をアップロードしてください。上位6枚がコンポジPDFに使用されます（先頭2枚はバストアップ・全身）。
          </p>
          <SetupPhotos talentId={talentId} photos={photos} />
        </section>
      )}

      <form ref={formRef} onSubmit={(e) => e.preventDefault()} className="space-y-10" onChange={handleChange}>
        {/* ステップ1: 基本情報 */}
        <div className={step === 1 ? "" : "hidden"}>
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              <h2 className="text-base font-semibold">基本情報</h2>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="lastName">姓 *</Label>
                <Input id="lastName" name="lastName" onBlur={handleBlur} />
                <FieldError name="lastName" clientErrors={fieldErrors} serverErrors={serverErrors} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="firstName">名 *</Label>
                <Input id="firstName" name="firstName" onBlur={handleBlur} />
                <FieldError name="firstName" clientErrors={fieldErrors} serverErrors={serverErrors} />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="lastNameKana">セイ *</Label>
                <Input id="lastNameKana" name="lastNameKana" onBlur={handleBlur} />
                <FieldError name="lastNameKana" clientErrors={fieldErrors} serverErrors={serverErrors} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="firstNameKana">メイ *</Label>
                <Input id="firstNameKana" name="firstNameKana" onBlur={handleBlur} />
                <FieldError name="firstNameKana" clientErrors={fieldErrors} serverErrors={serverErrors} />
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
        </div>

        {/* ステップ2: 身体情報・スキル */}
        <div className={step === 2 ? "" : "hidden"}>
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

          <section className="space-y-4 mt-10">
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
        </div>

        {/* ステップ3: SNS・振込先 */}
        <div className={step === 3 ? "" : "hidden"}>
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

          <section className="space-y-4 mt-10">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              <h2 className="text-base font-semibold">振込先情報 *</h2>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="bankName">銀行名 *</Label>
                <Input id="bankName" name="bankName" onBlur={handleBlur} />
                <FieldError name="bankName" clientErrors={fieldErrors} serverErrors={serverErrors} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bankBranch">支店名 *</Label>
                <Input id="bankBranch" name="bankBranch" onBlur={handleBlur} />
                <FieldError name="bankBranch" clientErrors={fieldErrors} serverErrors={serverErrors} />
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
                <FieldError name="bankAccountType" clientErrors={fieldErrors} serverErrors={serverErrors} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bankAccountNumber">口座番号 *</Label>
                <Input id="bankAccountNumber" name="bankAccountNumber" onBlur={handleBlur} />
                <FieldError name="bankAccountNumber" clientErrors={fieldErrors} serverErrors={serverErrors} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bankAccountHolder">口座名義 *</Label>
                <Input id="bankAccountHolder" name="bankAccountHolder" onBlur={handleBlur} />
                <FieldError name="bankAccountHolder" clientErrors={fieldErrors} serverErrors={serverErrors} />
              </div>
            </div>
          </section>
        </div>

        {/* ステップ4: パスワード */}
        <div className={step === 4 ? "" : "hidden"}>
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
                <Input id="password" name="password" type="password" onBlur={handleBlur} />
                <FieldError name="password" clientErrors={fieldErrors} serverErrors={serverErrors} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="passwordConfirm">パスワード確認 *</Label>
                <Input id="passwordConfirm" name="passwordConfirm" type="password" onBlur={handleBlur} />
                <FieldError name="passwordConfirm" clientErrors={fieldErrors} serverErrors={serverErrors} />
              </div>
            </div>
          </section>
        </div>

        {/* ナビゲーションボタン */}
        <div className="flex gap-3">
          {step > 1 && (
            <Button type="button" variant="outline" size="lg" className="flex-1" onClick={goPrev}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              戻る
            </Button>
          )}
          {step < TOTAL_STEPS ? (
            <Button type="button" size="lg" className="flex-1" onClick={goNext}>
              次へ
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button type="button" disabled={isSubmitting} size="lg" className="flex-1" onClick={handleSubmit}>
              {isSubmitting ? "登録中..." : "プロフィールを登録してはじめる"}
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}
