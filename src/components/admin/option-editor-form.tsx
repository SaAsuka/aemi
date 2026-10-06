"use client"

// 管理画面のオプションの作成・編集フォーム（「新規作成」ページと、オプション詳細の「編集」で使う）
// 送り先は createOption / updateOption（項目名は従来の OptionForm と同じ）

import { startTransition, useActionState, useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { AlertCircle, AlertTriangle, ChevronDown, ImagePlus, Loader2, Trash2 } from "lucide-react"
import { createOption, updateOption } from "@/lib/actions/option"
import type { Option } from "@/generated/prisma/client"
import { OPTION_CATEGORY_LABELS } from "@/types"
import { blobProxyUrl } from "@/lib/utils/blob"
import { BTN_PRIMARY, BTN_SECONDARY, FIELD, PANEL } from "@/components/admin/styles"

type ActionResult = { success?: boolean; error?: Record<string, string[] | undefined> } | null
type Errors = Record<string, string>

const TEXTAREA = `${FIELD} h-auto py-2 leading-relaxed`
const NUMBER_FIELDS = ["price", "sortOrder"] as const

// 締切の時刻：「その日の終わりまで」は23:59まで（従来の「日付だけの締切」と同じ扱い）
const TIME_OPTIONS = [
  { value: "", label: "その日の終わりまで" },
  ...Array.from({ length: 30 }, (_, i) => {
    const h = 9 + Math.floor(i / 2)
    const m = i % 2 === 0 ? "00" : "30"
    const v = `${String(h).padStart(2, "0")}:${m}`
    return { value: v, label: `${h}:${m}まで` }
  }),
]

// 既存の締切（日本時間）を「日付」と「時刻（終日なら空）」に分ける
function splitDeadline(deadline: Date | null | undefined) {
  if (!deadline) return { date: "", time: "" }
  const jst = new Date(new Date(deadline).getTime() + 9 * 60 * 60 * 1000)
  const pad = (n: number) => String(n).padStart(2, "0")
  const date = `${jst.getUTCFullYear()}-${pad(jst.getUTCMonth() + 1)}-${pad(jst.getUTCDate())}`
  const h = jst.getUTCHours()
  const m = jst.getUTCMinutes()
  return { date, time: h === 23 && m === 59 ? "" : `${pad(h)}:${pad(m)}` }
}

function isPastDeadline(date: string, time: string) {
  return new Date(`${date}T${time || "23:59"}:00+09:00`).getTime() < Date.now()
}

const STATUS_OPTIONS = {
  DRAFT: { title: "下書き", desc: "タレントには表示されません。内容を見直してから公開できます。" },
  ACTIVE: { title: "公開中", desc: "タレントのマイページに表示され、購入できるようになります。" },
  CLOSED: { title: "終了", desc: "受付を終えます。タレントは購入できなくなります。" },
} as const
type OptionStatus = keyof typeof STATUS_OPTIONS

function toHalfWidthNumber(value: string) {
  return value.replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0)).replace(/[,，\s]/g, "")
}

function validate(fd: FormData): Errors {
  const errors: Errors = {}
  const get = (k: string) => String(fd.get(k) ?? "").trim()
  if (!get("name")) errors.name = "オプション名を入力してください"
  const price = get("price")
  if (!price) errors.price = "価格を入力してください"
  else if (!/^\d+$/.test(price)) errors.price = "数字で入力してください"
  else if (Number(price) < 1) errors.price = "1円以上で入力してください"
  const sort = get("sortOrder")
  if (sort && !/^\d+$/.test(sort)) errors.sortOrder = "0以上の数字で入力してください"
  return errors
}

function fromServer(error: Record<string, string[] | undefined> | undefined): Errors {
  if (!error) return {}
  const out: Errors = {}
  for (const [k, v] of Object.entries(error)) {
    if (!v?.[0]) continue
    out[k] = /[a-zA-Z]/.test(v[0]) && !v[0].includes("Stripe") ? "入力内容を確認してください" : v[0]
  }
  // 決済（Stripe）の準備に失敗したときは、公開の設定のところに理由を出す
  if (out.status?.includes("Stripe")) {
    out.status = "決済の準備（Stripe）に失敗したため、公開できませんでした。少し時間をおいてもう一度試すか、いったん「下書き」で保存してください。"
  }
  if (out.price?.includes("Stripe")) {
    out.price = "決済（Stripe）の価格を変更できませんでした。少し時間をおいてもう一度試してください。"
  }
  return out
}

function focusFirstError(form: HTMLFormElement | null, errs: Errors) {
  if (!form) return
  const first = Array.from(form.querySelectorAll<HTMLElement>("[data-field]")).find((el) => errs[el.dataset.field ?? ""])
  first?.focus({ preventScroll: true })
  first?.scrollIntoView({ behavior: "smooth", block: "center" })
}

function ErrorText({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <p id={id} className="mt-1.5 flex items-start gap-1 text-xs text-red-600">
      <AlertCircle className="mt-px size-3.5 shrink-0" aria-hidden="true" />
      {children}
    </p>
  )
}

function Field({
  id,
  label,
  required,
  hint,
  error,
  className = "",
  children,
}: {
  id: string
  label: string
  required?: boolean
  hint?: string
  error?: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={`min-w-0 ${className}`}>
      <label htmlFor={id} className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-neutral-900">
        {label}
        {required && (
          <span className="rounded bg-red-600 px-1.5 py-px text-[10px] font-semibold leading-4 text-white">必須</span>
        )}
      </label>
      {children}
      {error ? <ErrorText id={`${id}-error`}>{error}</ErrorText> : hint && <p className="mt-1.5 text-xs text-neutral-500">{hint}</p>}
    </div>
  )
}

// plain：小窓（編集）の中では枠を付けず、区切り線だけで分ける
function Section({
  title,
  description,
  plain,
  children,
}: {
  title: string
  description?: string
  plain?: boolean
  children: React.ReactNode
}) {
  return (
    <section className={plain ? "border-t border-neutral-200 pt-6 first-of-type:border-t-0 first-of-type:pt-0" : `${PANEL} p-5 sm:p-6`}>
      <h2 className="text-base font-semibold text-neutral-950">{title}</h2>
      {description && <p className="mt-1 text-sm text-neutral-500">{description}</p>}
      <div className="mt-5 grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2">{children}</div>
    </section>
  )
}

function Choice({
  name,
  value,
  onChange,
  options,
  label,
}: {
  name: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  label: string
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex flex-wrap rounded-lg border border-neutral-300 p-0.5">
      {options.map((o) => (
        <label
          key={o.value}
          className={`inline-flex h-8 cursor-pointer items-center rounded-md px-3 text-sm transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-neutral-950/30 ${
            value === o.value ? "bg-neutral-950 font-medium text-white" : "text-neutral-600 hover:text-neutral-950"
          }`}
        >
          <input
            type="radio"
            name={name}
            value={o.value}
            checked={value === o.value}
            onChange={() => onChange(o.value)}
            className="sr-only"
          />
          {o.label}
        </label>
      ))}
    </div>
  )
}

export function OptionEditorForm({
  option,
  hasPurchases = false,
  inDialog = false,
  onSuccess,
  onCancel,
  onDirtyChange,
}: {
  // 編集のときに渡す。無ければ新規作成
  option?: Option
  // 購入されたことがあるか（価格を変えるときの注意書きに使う）
  hasPurchases?: boolean
  inDialog?: boolean
  onSuccess?: () => void
  onCancel?: () => void
  onDirtyChange?: (dirty: boolean) => void
}) {
  const isEdit = Boolean(option)
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [state, action, isPending] = useActionState(
    async (_prev: ActionResult, fd: FormData): Promise<ActionResult> => (option ? updateOption(option.id, fd) : createOption(fd)),
    null
  )
  const initialDeadline = useMemo(() => splitDeadline(option?.deadline), [option])
  const [clientErrors, setClientErrors] = useState<Errors>({})
  const [dirty, setDirty] = useState(false)
  const [status, setStatus] = useState<OptionStatus>((option?.status as OptionStatus) ?? "DRAFT")
  const [category, setCategory] = useState<string>(option?.category ?? "OTHER")
  const [deadlineDate, setDeadlineDate] = useState(initialDeadline.date)
  const [deadlineTime, setDeadlineTime] = useState(initialDeadline.time)
  const [imageUrl, setImageUrl] = useState(option?.imageUrl ?? "")
  // 入力のたびに画像を読み直さないよう、画像が変わったときだけ表示用のURLを作り直す
  const [preview, setPreview] = useState({ url: "", src: "" })
  if (imageUrl && preview.url !== imageUrl) setPreview({ url: imageUrl, src: blobProxyUrl(imageUrl, true) })
  const [uploading, setUploading] = useState(false)
  const [priceChanged, setPriceChanged] = useState(false)
  // 既存の締切の時刻が選択肢に無ければ、選択肢に足して表示できるようにする
  const timeOptions = useMemo(
    () =>
      initialDeadline.time && !TIME_OPTIONS.some((t) => t.value === initialDeadline.time)
        ? [...TIME_OPTIONS, { value: initialDeadline.time, label: `${initialDeadline.time.replace(/^0/, "")}まで` }].sort((a, b) =>
            a.value.localeCompare(b.value)
          )
        : TIME_OPTIONS,
    [initialDeadline]
  )

  const serverErrors = useMemo(() => fromServer(state?.error), [state])
  const errors = Object.keys(clientErrors).length ? clientErrors : serverErrors
  const errorCount = Object.keys(errors).length

  const deadlineValue = deadlineDate ? (deadlineTime ? `${deadlineDate}T${deadlineTime}` : deadlineDate) : ""
  const deadlineIsPast = useMemo(
    () => Boolean(deadlineDate) && isPastDeadline(deadlineDate, deadlineTime),
    [deadlineDate, deadlineTime]
  )

  const submitLabel = isEdit ? "保存する" : status === "ACTIVE" ? "作成して公開する" : "下書きとして保存"

  // 入力途中で画面を閉じよう・再読み込みしようとしたら確認を出す
  const saved = Boolean(state?.success)
  useEffect(() => {
    if (!dirty || saved) return
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener("beforeunload", onBeforeUnload)
    return () => window.removeEventListener("beforeunload", onBeforeUnload)
  }, [dirty, saved])

  const handledRef = useRef<ActionResult>(null)
  useEffect(() => {
    if (!state || handledRef.current === state) return
    handledRef.current = state
    if (state.success) {
      if (option) {
        toast.success("オプションを保存しました")
        onSuccess?.()
        return
      }
      toast.success(status === "ACTIVE" ? "オプションを作成し、公開しました" : "オプションを下書きとして保存しました")
      router.push("/admin/options")
    } else if (state.error) {
      focusFirstError(formRef.current, fromServer(state.error))
    }
  }, [state, router, status, option, onSuccess])

  const handleImageUpload = useCallback(async (file: File) => {
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      fd.append("category", "photos")
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error ?? "アップロードに失敗しました")
      }
      const { url } = await res.json()
      setImageUrl(url)
      setDirty(true)
      onDirtyChange?.(true)
    } catch (e) {
      toast.error("画像をアップロードできませんでした", {
        description: e instanceof Error ? e.message : undefined,
      })
    } finally {
      setUploading(false)
    }
  }, [onDirtyChange])

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    // フォームの action に渡すと送信後に入力欄が空になる（React 19）ため、ここで受け取って送る
    e.preventDefault()
    if (isPending || uploading) return
    const fd = new FormData(e.currentTarget)
    for (const k of NUMBER_FIELDS) fd.set(k, toHalfWidthNumber(String(fd.get(k) ?? "")))
    const errs = validate(fd)
    setClientErrors(errs)
    if (Object.keys(errs).length) {
      focusFirstError(formRef.current, errs)
      return
    }
    startTransition(() => action(fd))
  }

  const defaults: Record<string, string> = {
    name: option?.name ?? "",
    description: option?.description ?? "",
    price: option?.price?.toString() ?? "",
    sortOrder: option?.sortOrder?.toString() ?? "0",
  }
  const clearError = (name: string) => {
    if (!clientErrors[name]) return
    setClientErrors((prev) => {
      const next = { ...prev }
      delete next[name]
      return next
    })
  }
  const fieldProps = (name: string) => ({
    id: name,
    name,
    defaultValue: defaults[name] ?? "",
    "data-field": name,
    "aria-invalid": Boolean(errors[name]) || undefined,
    "aria-describedby": errors[name] ? `${name}-error` : undefined,
    onInput: () => clearError(name),
  })
  const numberBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const v = toHalfWidthNumber(e.currentTarget.value)
    if (v !== e.currentTarget.value) e.currentTarget.value = v
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      onChange={() => {
        if (!dirty) onDirtyChange?.(true)
        setDirty(true)
      }}
      noValidate
      className="space-y-5"
    >
      {errorCount > 0 && (
        <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <p>入力内容に確認が必要な項目が{errorCount}件あります。赤字の項目を直してから、もう一度押してください。</p>
        </div>
      )}

      <Section
        plain={inDialog}
        title="オプションの内容"
        description="タレントのマイページに、この内容で表示されます。"
      >
        <Field id="name" label="オプション名" required error={errors.name} className="sm:col-span-2">
          <input {...fieldProps("name")} autoComplete="off" placeholder="例: プロフィール写真撮影（スタジオ）" className={FIELD} />
        </Field>
        <div className="sm:col-span-2">
          <p className="mb-1.5 text-sm font-medium text-neutral-900">カテゴリ</p>
          <Choice
            name="category"
            label="カテゴリ"
            value={category}
            onChange={setCategory}
            options={Object.entries(OPTION_CATEGORY_LABELS).map(([value, label]) => ({ value, label }))}
          />
        </div>
        <Field id="description" label="詳しい内容" error={errors.description} className="sm:col-span-2" hint="内容・所要時間・持ち物など。改行もそのまま表示されます">
          <textarea {...fieldProps("description")} rows={5} placeholder="例: プロのカメラマンがスタジオでプロフィール写真を撮影します。所要時間 約60分。" className={TEXTAREA} />
        </Field>
        <Field
          id="price"
          label="価格（税込）"
          required
          error={errors.price}
          hint={isEdit && hasPurchases && priceChanged ? undefined : "タレントがこの金額を支払います"}
        >
          <div className="relative">
            <input
              {...fieldProps("price")}
              onInput={(e) => {
                clearError("price")
                setPriceChanged(toHalfWidthNumber(e.currentTarget.value) !== defaults.price)
              }}
              onBlur={numberBlur}
              type="text"
              inputMode="numeric"
              autoComplete="off"
              placeholder="例: 15000"
              className={`${FIELD} pr-10`}
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-neutral-400">円</span>
          </div>
          {isEdit && hasPurchases && priceChanged && !errors.price && (
            <p className="mt-1.5 text-xs text-neutral-500">新しい価格は、これからの購入に使われます。すでに購入した人の金額は変わりません。</p>
          )}
        </Field>
      </Section>

      <section className={inDialog ? "border-t border-neutral-200 pt-6" : `${PANEL} p-5 sm:p-6`}>
        <h2 className="text-base font-semibold text-neutral-950">画像</h2>
        <p className="mt-1 text-sm text-neutral-500">タレントのマイページで、横長（16:9）で表示されます。無くてもかまいません。</p>
        <input type="hidden" name="imageUrl" value={imageUrl} />
        <div className="mt-5">
          {imageUrl ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview.url === imageUrl ? preview.src : undefined}
                alt="オプションの画像"
                className="aspect-video w-full rounded-lg border border-neutral-200 bg-neutral-50 object-cover sm:w-80"
              />
              <div className="flex gap-2">
                <label className={`${BTN_SECONDARY} flex-1 cursor-pointer sm:flex-none ${uploading ? "pointer-events-none opacity-60" : ""}`}>
                  {uploading ? <Loader2 className="animate-spin" aria-hidden="true" /> : <ImagePlus aria-hidden="true" />}
                  {uploading ? "アップロード中…" : "画像を変える"}
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    disabled={uploading}
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleImageUpload(file)
                      e.target.value = ""
                    }}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setImageUrl("")
                    setDirty(true)
                    onDirtyChange?.(true)
                  }}
                  className={`${BTN_SECONDARY} flex-1 text-red-600 hover:text-red-700 sm:flex-none`}
                >
                  <Trash2 aria-hidden="true" />
                  外す
                </button>
              </div>
            </div>
          ) : (
            <label
              className={`flex aspect-video w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-neutral-300 bg-neutral-50 text-sm text-neutral-600 transition-colors hover:border-neutral-400 hover:bg-neutral-100 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-neutral-950/30 sm:w-80 ${
                uploading ? "pointer-events-none opacity-60" : ""
              }`}
            >
              {uploading ? (
                <Loader2 className="size-6 animate-spin text-neutral-400" aria-hidden="true" />
              ) : (
                <ImagePlus className="size-6 text-neutral-400" aria-hidden="true" />
              )}
              <span className="font-medium text-neutral-800">{uploading ? "アップロード中…" : "画像を選ぶ"}</span>
              <span className="text-xs text-neutral-500">JPG・PNG など</span>
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                disabled={uploading}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleImageUpload(file)
                  e.target.value = ""
                }}
              />
            </label>
          )}
        </div>
      </section>

      <Section
        plain={inDialog}
        title="申込締切と表示順"
        description="締切は、タレントのページに「申込締切」として表示されます。"
      >
        <input type="hidden" name="deadline" value={deadlineValue} />
        <Field id="deadlineDate" label="申込締切" hint={deadlineDate ? undefined : "空欄なら締切なし"}>
          <input
            id="deadlineDate"
            type="date"
            value={deadlineDate}
            onChange={(e) => setDeadlineDate(e.target.value)}
            className={FIELD}
          />
        </Field>
        <Field id="deadlineTime" label="時刻">
          <div className="relative">
            <select
              id="deadlineTime"
              value={deadlineTime}
              onChange={(e) => setDeadlineTime(e.target.value)}
              disabled={!deadlineDate}
              className={`${FIELD} appearance-none pr-9 disabled:bg-neutral-50 disabled:text-neutral-400`}
            >
              {timeOptions.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-neutral-500" aria-hidden="true" />
          </div>
        </Field>
        {deadlineIsPast && (
          <p className="flex items-start gap-1.5 rounded-lg bg-yellow-50 px-3 py-2.5 text-xs leading-relaxed text-yellow-800 sm:col-span-2">
            <AlertTriangle className="mt-px size-4 shrink-0" aria-hidden="true" />
            締切がすでに過ぎた日時になっています。日付を確認してください。
          </p>
        )}
        <Field id="sortOrder" label="表示順" error={errors.sortOrder} hint="小さい数字ほど上に表示されます（同じ数字なら新しい順）">
          <input
            {...fieldProps("sortOrder")}
            onBlur={numberBlur}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            className={`${FIELD} sm:max-w-32`}
          />
        </Field>
      </Section>

      <section className={inDialog ? "border-t border-neutral-200 pt-6" : `${PANEL} p-5 sm:p-6`}>
        <h2 className="text-base font-semibold text-neutral-950">{isEdit ? "公開の状態" : "作成したあとの状態"}</h2>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3" role="radiogroup" aria-label="公開の状態" data-field="status" tabIndex={-1}>
          {(Object.keys(STATUS_OPTIONS) as OptionStatus[])
            .filter((v) => isEdit || v !== "CLOSED")
            .map((v) => {
              const o = STATUS_OPTIONS[v]
              const active = status === v
              return (
                <label
                  key={v}
                  className={`flex cursor-pointer gap-3 rounded-xl border p-4 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-neutral-950/30 ${
                    active ? "border-neutral-950 bg-neutral-50" : "border-neutral-200 hover:border-neutral-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="status"
                    value={v}
                    checked={active}
                    onChange={() => setStatus(v)}
                    className="mt-0.5 size-4 shrink-0 accent-neutral-950"
                  />
                  <span>
                    <span className="block text-sm font-medium text-neutral-950">{isEdit ? o.title : v === "ACTIVE" ? "すぐに公開する" : "下書きとして保存"}</span>
                    <span className="mt-1 block text-xs leading-relaxed text-neutral-500">{o.desc}</span>
                  </span>
                </label>
              )
            })}
        </div>
        {errors.status && <ErrorText>{errors.status}</ErrorText>}
      </section>

      {/* 保存ボタンは画面（小窓）の下に常に出しておく */}
      <div
        className={
          inDialog
            ? "sticky -bottom-6 z-10 -mx-6 -mb-6 border-t border-neutral-200 bg-white px-6 py-3"
            : "sticky -bottom-3 z-10 -mx-3 border-t border-neutral-200 bg-white/95 px-3 py-3 sm:-bottom-6 sm:-mx-6 sm:px-6"
        }
      >
        <div className="mx-auto flex max-w-3xl items-center justify-end gap-2">
          {onCancel ? (
            <button type="button" onClick={onCancel} className={`${BTN_SECONDARY} h-10 flex-1 sm:flex-none`}>
              キャンセル
            </button>
          ) : (
            <Link href="/admin/options" className={`${BTN_SECONDARY} h-10 flex-1 sm:flex-none`}>
              キャンセル
            </Link>
          )}
          <button type="submit" disabled={isPending || uploading} className={`${BTN_PRIMARY} h-10 flex-[2] sm:flex-none sm:px-8`}>
            {isPending ? (
              <>
                <Loader2 className="animate-spin" aria-hidden="true" />
                保存中…
              </>
            ) : (
              submitLabel
            )}
          </button>
        </div>
      </div>
    </form>
  )
}
