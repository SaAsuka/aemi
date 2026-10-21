"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState, useCallback, useRef } from "react"
import { setupTalent } from "@/lib/actions/talent-setup"
import { addTalentPhoto, deleteTalentPhoto, reorderTalentPhotos } from "@/lib/actions/talent-photo"
import { blobProxyUrl } from "@/lib/utils/blob"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AlertCircle, Plus, Loader2, Trash2, GripVertical, ChevronLeft, ChevronRight, ImagePlus, RotateCcw } from "lucide-react"
import { BTN_PRIMARY, BTN_SECONDARY, FIELD, PANEL, SELECT_TRIGGER, TEXTAREA } from "@/components/talent/styles"
import type { TalentPhoto } from "@/generated/prisma/client"
import { SortableGrid } from "@/components/sortable-grid"

const STORAGE_KEY = "vozel_setup_draft"
const TOTAL_STEPS = 4

type ActionResult = { success?: boolean; redirect?: string; error?: Record<string, string[]> } | null

function photoLabel(idx: number): string {
  if (idx === 0) return "バストアップ"
  if (idx === 1) return "全身"
  return `#${idx + 1}`
}

const STEP_LABELS = ["写真・基本情報", "身体・スキル", "SNS・振込先", "パスワード"]

// --- ステッププログレスバー ---
function StepProgressBar({ current, total }: { current: number; total: number }) {
  return (
    <div>
      <p className="flex items-baseline gap-2 text-sm">
        <span className="font-semibold tabular-nums text-neutral-950">
          STEP {current}
          <span className="font-normal text-neutral-400"> / {total}</span>
        </span>
        <span className="text-neutral-600">{STEP_LABELS[current - 1]}</span>
      </p>
      <ol className="mt-3 grid grid-cols-4 gap-1.5" aria-label={`全${total}ステップ中 ${current} ステップ目`}>
        {STEP_LABELS.map((label, idx) => {
          const step = idx + 1
          return (
            <li key={label}>
              <span
                className={`block h-1 rounded-full transition-colors duration-300 ${
                  current >= step ? "bg-neutral-950" : "bg-neutral-200"
                }`}
              />
              <span
                className={`mt-2 hidden text-xs sm:block ${
                  current === step ? "font-medium text-neutral-950" : current > step ? "text-neutral-600" : "text-neutral-400"
                }`}
                aria-current={current === step ? "step" : undefined}
              >
                {label}
              </span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

// --- 入力欄の枠（ラベル・必須・補足・エラー） ---
function Field({
  id,
  label,
  required,
  hint,
  className = "",
  error,
  children,
}: {
  id: string
  label: string
  required?: boolean
  hint?: string
  className?: string
  error?: React.ReactNode
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
      {error}
      {hint && <p className="mt-1.5 text-xs text-neutral-500">{hint}</p>}
    </div>
  )
}

// --- 区切り（カード） ---
function Section({
  title,
  description,
  children,
}: {
  title: string
  description?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className={`${PANEL} p-5 sm:p-6`}>
      <h2 className="text-base font-semibold text-neutral-950">{title}</h2>
      {description && <p className="mt-1 text-sm leading-relaxed text-neutral-500">{description}</p>}
      <div className="mt-5">{children}</div>
    </section>
  )
}

// --- 写真セクション ---
function SetupPhotos({ talentId, photos: initialPhotos }: { talentId: string; photos: TalentPhoto[] }) {
  const [photos, setPhotos] = useState(initialPhotos)
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})
  const [reorderError, setReorderError] = useState<string | null>(null)

  const uploading = Object.keys(uploadProgress).length > 0

  const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files?.length) return
    try {
      for (const file of Array.from(files)) {
        setUploadProgress((prev) => ({ ...prev, [file.name]: 0 }))
        const fd = new FormData()
        fd.append("file", file)
        fd.append("category", "photos")
        fd.append("id", talentId)
        const res = await fetch("/api/upload", { method: "POST", body: fd })
        if (!res.ok) throw new Error((await res.json()).error ?? "アップロードに失敗しました")
        const { url } = await res.json()
        setUploadProgress((prev) => {
          const next = { ...prev }
          delete next[file.name]
          return next
        })
        await addTalentPhoto(talentId, url)
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

  // 並べ替えたらすぐ画面に反映し、保存に失敗したら元の並びに戻す
  const handleReorder = useCallback(async (next: TalentPhoto[]) => {
    const prev = photos
    setPhotos(next)
    setReorderError(null)
    try {
      await reorderTalentPhotos(talentId, next.map(p => p.id))
    } catch {
      setPhotos(prev)
      setReorderError("並べ替えを保存できませんでした。もう一度お試しください")
    }
  }, [photos, talentId])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <span className="text-sm font-semibold tabular-nums text-neutral-950">{photos.length} 枚</span>
          {photos.length >= 6 ? (
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
              コンポジOK（上位6枚を使用）
            </span>
          ) : (
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
              コンポジPDF生成には6枚以上必要です
            </span>
          )}
        </div>
        <button
          type="button"
          disabled={uploading}
          onClick={() => document.getElementById("setup-photo-upload")?.click()}
          className={`${BTN_SECONDARY} h-10 px-3 text-sm`}
        >
          {uploading ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Plus aria-hidden="true" />}
          写真を追加
        </button>
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
        <div key={name} className="space-y-1.5">
          <p className="truncate text-xs text-neutral-500">{name}</p>
          <div className="h-1.5 overflow-hidden rounded-full bg-neutral-100">
            <div
              className="h-full rounded-full bg-neutral-950 transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      ))}

      {photos.length === 0 && !uploading ? (
        <button
          type="button"
          onClick={() => document.getElementById("setup-photo-upload")?.click()}
          className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-neutral-300 bg-neutral-50 px-4 py-10 text-center transition-colors hover:border-neutral-400 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-neutral-950/10"
        >
          <ImagePlus className="size-7 text-neutral-400" aria-hidden="true" />
          <span className="text-sm font-medium text-neutral-900">写真を選ぶ</span>
          <span className="text-xs text-neutral-500">何枚でもまとめて選べます</span>
        </button>
      ) : (
        <>
          <p className="text-xs text-neutral-500">写真をドラッグ（スマホは長押し）で並べ替えできます</p>
          {reorderError && (
            <p role="alert" className="flex items-start gap-1.5 text-sm text-red-600">
              <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              {reorderError}
            </p>
          )}
          <SortableGrid
            items={photos}
            onReorder={handleReorder}
            className="grid grid-cols-2 gap-3 sm:grid-cols-3"
            renderItem={(photo, idx, { handleProps, isDragging }) => (
              <div
                className={`group relative overflow-hidden rounded-xl bg-neutral-100 ring-1 transition-shadow ${idx < 6 ? "ring-neutral-950/20" : "ring-neutral-200"} ${isDragging ? "opacity-80 shadow-xl ring-2 ring-neutral-950" : "hover:ring-neutral-950/40"}`}
              >
                <img src={blobProxyUrl(photo.url)} alt={photoLabel(idx)} draggable={false} className="pointer-events-none aspect-[3/4] w-full object-cover" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2.5 pt-6">
                  <span className="text-xs font-medium text-white">
                    {photoLabel(idx)}
                    {idx < 6 && <span className="ml-1.5 text-[10px] opacity-75">コンポジ</span>}
                  </span>
                </div>
                <div className="absolute right-1.5 top-1.5 flex gap-1">
                  <button
                    type="button"
                    {...handleProps}
                    aria-label={`${photoLabel(idx)}の写真を並べ替える`}
                    className="cursor-grab rounded-lg bg-black/55 p-2 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  >
                    <GripVertical className="size-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(photo.id)}
                    aria-label={`${photoLabel(idx)}の写真を削除`}
                    className="rounded-lg bg-black/55 p-2 text-white transition-colors hover:bg-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            )}
          />
        </>
      )}
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
  let serverErr = serverErrors?.[name]?.[0]
  if (serverErr && !/[　-鿿]/.test(serverErr)) {
    serverErr = "入力内容を確認してください"
  }
  const msg = clientErr || serverErr
  if (!msg) return null
  return (
    <p id={`${name}-error`} className="mt-1.5 flex items-start gap-1 text-xs text-red-600">
      <AlertCircle className="mt-px size-3.5 shrink-0" aria-hidden="true" />
      {msg}
    </p>
  )
}

// --- メインフォーム ---
export function TalentSetupForm({ email, talentId, photos }: { email: string; talentId: string; photos: TalentPhoto[] }) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | undefined>>({})
  const [serverErrors, setServerErrors] = useState<Record<string, string[]> | null>(null)
  const [stepError, setStepError] = useState<string | null>(null)
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

    const formData = new FormData(form)
    for (const name of fields) {
      const value = (formData.get(name) as string) ?? ""
      if (!value.trim()) {
        errors[name] = "この項目は必須です"
        valid = false
      }
    }

    if (step === 4) {
      const pw = (formData.get("password") as string) ?? ""
      const confirm = (formData.get("passwordConfirm") as string) ?? ""
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
    if (!valid) {
      const count = Object.keys(errors).length
      setStepError(`未入力の項目が${count}件あります`)
      window.scrollTo(0, 0)
    } else {
      setStepError(null)
    }
    return valid
  }, [step])

  const goNext = useCallback(() => {
    if (validateCurrentStep()) {
      setStepError(null)
      saveDraft()
      const next = Math.min(step + 1, TOTAL_STEPS)
      setStep(next)
      history.pushState({ setupStep: next }, "")
      window.scrollTo(0, 0)
    }
  }, [validateCurrentStep, saveDraft, step])

  const goPrev = useCallback(() => {
    const prev = Math.max(step - 1, 1)
    setStep(prev)
    history.pushState({ setupStep: prev }, "")
    window.scrollTo(0, 0)
  }, [step])

  const FIELD_TO_STEP: Record<string, number> = {
    lastName: 1, firstName: 1, lastNameKana: 1, firstNameKana: 1,
    gender: 1, birthDate: 1, category: 1, phone: 1,
    height: 2, bust: 2, waist: 2, hip: 2, shoeSize: 2,
    bankName: 3, bankBranch: 3, bankAccountType: 3, bankAccountNumber: 3, bankAccountHolder: 3,
    instagramUrl: 3, xUrl: 3, tiktokUrl: 3, websiteUrl: 3,
    password: 4, passwordConfirm: 4,
  }

  const FIELD_LABELS: Record<string, string> = {
    lastName: "姓", firstName: "名", lastNameKana: "セイ", firstNameKana: "メイ",
    gender: "性別", birthDate: "生年月日", category: "カテゴリ", phone: "電話番号",
    height: "身長", bust: "B", waist: "W", hip: "H", shoeSize: "靴サイズ",
    bankName: "銀行名", bankBranch: "支店名", bankAccountType: "種別",
    bankAccountNumber: "口座番号", bankAccountHolder: "口座名義",
    password: "パスワード", passwordConfirm: "パスワード確認",
  }

  const navigateToErrorStep = useCallback((errors: Record<string, string[]>) => {
    let minStep = TOTAL_STEPS
    const messages: string[] = []
    for (const [key, msgs] of Object.entries(errors)) {
      if (key === "_form") continue
      const s = FIELD_TO_STEP[key]
      if (s != null && s < minStep) minStep = s
      const label = FIELD_LABELS[key] || key
      const msg = msgs[0]
      if (msg) {
        const isJapanese = /[\u3000-\u9fff]/.test(msg)
        messages.push(isJapanese ? msg : `${label}の入力内容を確認してください`)
      }
    }
    setStepError(messages.length > 0 ? messages.join("、") : "入力内容にエラーがあります")
    setStep(minStep)
    window.scrollTo(0, 0)
  }, [])

  const validateAllSteps = useCallback((): boolean => {
    if (!formRef.current) return false
    const formData = new FormData(formRef.current)
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
        const value = (formData.get(name) as string) ?? ""
        if (!value.trim()) {
          errors[name] = "この項目は必須です"
          if (!firstErrorStep) firstErrorStep = s
        }
      }
    }

    const pw = (formData.get("password") as string) ?? ""
    const confirm = (formData.get("passwordConfirm") as string) ?? ""
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
      const count = Object.keys(errors).length
      setStepError(`未入力の項目が${count}件あります`)
      setStep(firstErrorStep)
      window.scrollTo(0, 0)
      return false
    }
    setStepError(null)
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


  // エラーのある欄を赤枠にし、読み上げでエラー文につなぐ
  const errorProps = (name: string) => {
    const hasError = Boolean(fieldErrors[name] || serverErrors?.[name]?.length)
    return {
      "aria-invalid": hasError || undefined,
      "aria-describedby": hasError ? `${name}-error` : undefined,
    }
  }
  const fieldError = (name: string) => (
    <FieldError name={name} clientErrors={fieldErrors} serverErrors={serverErrors} />
  )

  return (
    <div className="space-y-5">
      <StepProgressBar current={step} total={TOTAL_STEPS} />

      {restored && (
        <div role="status" className="flex items-start gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-700">
          <RotateCcw className="mt-0.5 size-4 shrink-0 text-neutral-500" aria-hidden="true" />
          前回の入力データを復元しました
        </div>
      )}

      {stepError && (
        <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <p>{stepError}</p>
        </div>
      )}

      {serverErrors?._form && (
        <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <p>{serverErrors._form[0]}</p>
        </div>
      )}

      {/* ステップ1: 写真・基本情報 */}
      {step === 1 && (
        <Section
          title="宣材写真"
          description="写真をアップロードしてください。上位6枚がコンポジPDFに使用されます（先頭2枚はバストアップ・全身）。"
        >
          <SetupPhotos talentId={talentId} photos={photos} />
        </Section>
      )}

      <form ref={formRef} onSubmit={(e) => e.preventDefault()} noValidate className="space-y-5" onChange={handleChange}>
        {/* ステップ1: 基本情報 */}
        <div className={step === 1 ? "" : "hidden"}>
          <Section title="基本情報">
            <div className="grid grid-cols-2 gap-x-3 gap-y-5 sm:gap-x-4">
              <Field id="lastName" label="姓" required error={fieldError("lastName")}>
                <input id="lastName" name="lastName" onBlur={handleBlur} autoComplete="family-name" className={FIELD} {...errorProps("lastName")} />
              </Field>
              <Field id="firstName" label="名" required error={fieldError("firstName")}>
                <input id="firstName" name="firstName" onBlur={handleBlur} autoComplete="given-name" className={FIELD} {...errorProps("firstName")} />
              </Field>
              <Field id="lastNameKana" label="セイ" required error={fieldError("lastNameKana")}>
                <input id="lastNameKana" name="lastNameKana" onBlur={handleBlur} className={FIELD} {...errorProps("lastNameKana")} />
              </Field>
              <Field id="firstNameKana" label="メイ" required error={fieldError("firstNameKana")}>
                <input id="firstNameKana" name="firstNameKana" onBlur={handleBlur} className={FIELD} {...errorProps("firstNameKana")} />
              </Field>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-x-4 gap-y-5 border-t border-neutral-100 pt-5 sm:grid-cols-2">
              <Field id="stageName" label="芸名">
                <input id="stageName" name="stageName" placeholder="コンポジPDFに表記される名前" className={FIELD} />
              </Field>
              <Field id="nameRomaji" label="ローマ字名">
                <input id="nameRomaji" name="nameRomaji" placeholder="例: Taro Yamada" className={FIELD} />
              </Field>
              <Field id="email" label="メールアドレス">
                <input id="email" type="email" value={email} readOnly className={FIELD} />
              </Field>
              <Field id="phone" label="電話番号">
                <input id="phone" name="phone" type="tel" autoComplete="tel" className={FIELD} />
              </Field>
              <Field id="category" label="芸能カテゴリ">
                <input id="category" name="category" placeholder="例: 俳優、モデル、声優" className={FIELD} />
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
                <input
                  id="birthDate"
                  name="birthDate"
                  type="date"
                  className={`${FIELD} appearance-none [&::-webkit-date-and-time-value]:text-left`}
                />
              </Field>
              <Field id="birthplace" label="出身地">
                <input id="birthplace" name="birthplace" placeholder="例: 東京都" className={FIELD} />
              </Field>
              <Field id="nearestStation" label="最寄駅">
                <input id="nearestStation" name="nearestStation" placeholder="例: 渋谷駅" className={FIELD} />
              </Field>
              <Field id="address" label="現住所" className="sm:col-span-2">
                <input id="address" name="address" className={FIELD} />
              </Field>
            </div>
          </Section>
        </div>

        {/* ステップ2: 身体情報・スキル */}
        <div className={step === 2 ? "space-y-5" : "hidden"}>
          <Section title="身体情報">
            <div className="grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-5">
              <Field id="height" label="身長 (cm)">
                <input id="height" name="height" type="number" className={FIELD} />
              </Field>
              <Field id="bust" label="B (cm)">
                <input id="bust" name="bust" type="number" className={FIELD} />
              </Field>
              <Field id="waist" label="W (cm)">
                <input id="waist" name="waist" type="number" className={FIELD} />
              </Field>
              <Field id="hip" label="H (cm)">
                <input id="hip" name="hip" type="number" className={FIELD} />
              </Field>
              <Field id="shoeSize" label="靴 (cm)">
                <input id="shoeSize" name="shoeSize" type="number" step="0.5" className={FIELD} />
              </Field>
            </div>
          </Section>

          <Section title="スキル・経歴">
            <div className="grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2">
              <Field id="skills" label="特技">
                <input id="skills" name="skills" placeholder="例: インドネシア語、殺陣" className={FIELD} />
              </Field>
              <Field id="hobbies" label="趣味">
                <input id="hobbies" name="hobbies" placeholder="例: 釣り、料理、ゴルフ" className={FIELD} />
              </Field>
              <Field id="qualifications" label="資格" className="sm:col-span-2">
                <input id="qualifications" name="qualifications" placeholder="例: 普通自動車免許、英検2級" className={FIELD} />
              </Field>
              <Field id="career" label="経歴" className="sm:col-span-2">
                <textarea id="career" name="career" rows={4} placeholder="出演歴・受賞歴など" className={TEXTAREA} />
              </Field>
              <Field id="representativeWork" label="代表作" className="sm:col-span-2">
                <textarea id="representativeWork" name="representativeWork" rows={2} placeholder="代表的な出演作品" className={TEXTAREA} />
              </Field>
            </div>
          </Section>
        </div>

        {/* ステップ3: SNS・振込先 */}
        <div className={step === 3 ? "space-y-5" : "hidden"}>
          <Section title="SNS">
            <div className="grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2">
              <Field id="instagramUrl" label="Instagram">
                <input id="instagramUrl" name="instagramUrl" type="url" inputMode="url" autoCapitalize="none" spellCheck={false} placeholder="https://instagram.com/..." className={FIELD} />
              </Field>
              <Field id="xUrl" label="X (Twitter)">
                <input id="xUrl" name="xUrl" type="url" inputMode="url" autoCapitalize="none" spellCheck={false} placeholder="https://x.com/..." className={FIELD} />
              </Field>
              <Field id="tiktokUrl" label="TikTok">
                <input id="tiktokUrl" name="tiktokUrl" type="url" inputMode="url" autoCapitalize="none" spellCheck={false} placeholder="https://tiktok.com/..." className={FIELD} />
              </Field>
              <Field id="websiteUrl" label="公式HP等">
                <input id="websiteUrl" name="websiteUrl" type="url" inputMode="url" autoCapitalize="none" spellCheck={false} placeholder="https://..." className={FIELD} />
              </Field>
            </div>
          </Section>

          <Section title="振込先情報">
            <div className="grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2">
              <Field id="bankName" label="銀行名" required error={fieldError("bankName")}>
                <input id="bankName" name="bankName" onBlur={handleBlur} className={FIELD} {...errorProps("bankName")} />
              </Field>
              <Field id="bankBranch" label="支店名" required error={fieldError("bankBranch")}>
                <input id="bankBranch" name="bankBranch" onBlur={handleBlur} className={FIELD} {...errorProps("bankBranch")} />
              </Field>
              <Field id="bankAccountType" label="種別" required error={fieldError("bankAccountType")}>
                <Select name="bankAccountType">
                  <SelectTrigger id="bankAccountType" className={SELECT_TRIGGER} {...errorProps("bankAccountType")}>
                    <SelectValue placeholder="選択">{(v) => v || "選択"}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="普通" label="普通">普通</SelectItem>
                    <SelectItem value="当座" label="当座">当座</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field id="bankAccountNumber" label="口座番号" required error={fieldError("bankAccountNumber")}>
                <input id="bankAccountNumber" name="bankAccountNumber" onBlur={handleBlur} inputMode="numeric" className={FIELD} {...errorProps("bankAccountNumber")} />
              </Field>
              <Field id="bankAccountHolder" label="口座名義" required error={fieldError("bankAccountHolder")} className="sm:col-span-2">
                <input id="bankAccountHolder" name="bankAccountHolder" onBlur={handleBlur} className={FIELD} {...errorProps("bankAccountHolder")} />
              </Field>
            </div>
          </Section>
        </div>

        {/* ステップ4: パスワード */}
        <div className={step === 4 ? "" : "hidden"}>
          <Section
            title="パスワード設定"
            description={
              <>
                <span className="inline-block">ログインに使用するパスワードを</span>
                <span className="inline-block">設定してください（8文字以上）</span>
              </>
            }
          >
            <div className="grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2">
              <Field id="password" label="パスワード" required error={fieldError("password")}>
                <input id="password" name="password" type="password" onBlur={handleBlur} autoComplete="new-password" className={FIELD} {...errorProps("password")} />
              </Field>
              <Field id="passwordConfirm" label="パスワード確認" required error={fieldError("passwordConfirm")}>
                <input id="passwordConfirm" name="passwordConfirm" type="password" onBlur={handleBlur} autoComplete="new-password" className={FIELD} {...errorProps("passwordConfirm")} />
              </Field>
            </div>
          </Section>
        </div>

        {/* ナビゲーションボタン */}
        <div className="flex gap-3 pt-1">
          {step > 1 && (
            // スマホでは「戻る」を矢印だけにして、進むボタンの文言が1行に収まるようにする
            <button type="button" className={`${BTN_SECONDARY} w-12 px-0 sm:w-auto sm:flex-1 sm:px-4`} onClick={goPrev}>
              <ChevronLeft aria-hidden="true" />
              <span className="max-sm:sr-only">戻る</span>
            </button>
          )}
          {step < TOTAL_STEPS ? (
            <button type="button" className={`${BTN_PRIMARY} flex-1 sm:flex-[2]`} onClick={goNext}>
              次へ
              <ChevronRight aria-hidden="true" />
            </button>
          ) : (
            <button type="button" disabled={isSubmitting} className={`${BTN_PRIMARY} flex-1 sm:flex-[2]`} onClick={handleSubmit}>
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" aria-hidden="true" />
                  登録中…
                </>
              ) : (
                "プロフィールを登録してはじめる"
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
