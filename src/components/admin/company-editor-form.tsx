"use client"

// 管理画面の制作会社の登録・編集フォーム（「新規登録」ページと、制作会社詳細の「編集」で使う）
// 送り先は createProductionCompany / updateProductionCompany（項目名は従来の ProductionCompanyForm と同じ）

import { startTransition, useActionState, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { AlertCircle, Info, Loader2 } from "lucide-react"
import { createProductionCompany, updateProductionCompany } from "@/lib/actions/production-company"
import type { ProductionCompany } from "@/generated/prisma/client"
import { BTN_PRIMARY, BTN_SECONDARY, FIELD, PANEL } from "@/components/admin/styles"

type ActionResult = { success?: boolean; id?: string; error?: Record<string, string[] | undefined> } | null
type Errors = Record<string, string>

const TEXTAREA = `${FIELD} h-auto py-2 leading-relaxed`
// 郵便番号・電話番号は、全角で入れても半角にそろえる
const HALF_WIDTH_FIELDS = ["zipCode", "contactPhone"] as const

function toHalfWidth(value: string) {
  return value
    .replace(/^〒\s*/, "")
    .replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/[－ー―‐−]/g, "-")
    .replace(/[（]/g, "(")
    .replace(/[）]/g, ")")
    .trim()
}

function validate(fd: FormData): Errors {
  const errors: Errors = {}
  const get = (k: string) => String(fd.get(k) ?? "").trim()
  if (!get("companyName")) errors.companyName = "会社名を入力してください"
  const email = get("contactEmail")
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.contactEmail = "メールアドレスの形を確認してください（例: name@example.com）"
  const zip = get("zipCode")
  if (zip && !/^\d{3}-?\d{4}$/.test(zip)) errors.zipCode = "7けたの数字で入力してください（例: 150-0001）"
  return errors
}

function fromServer(error: Record<string, string[] | undefined> | undefined): Errors {
  if (!error) return {}
  const out: Errors = {}
  for (const [k, v] of Object.entries(error)) {
    if (!v?.[0]) continue
    out[k] = /freee/i.test(v[0])
      ? "freeeに取引先を登録できなかったため、保存しませんでした。設定ページでfreeeとの連携を確認してから、もう一度押してください。"
      : /[a-zA-Z]/.test(v[0])
        ? "入力内容を確認してください"
        : v[0]
  }
  return out
}

function focusFirstError(form: HTMLFormElement | null, errs: Errors) {
  if (!form) return
  const first = Array.from(form.querySelectorAll<HTMLElement>("[data-field]")).find((el) => errs[el.dataset.field ?? ""])
  first?.focus({ preventScroll: true })
  first?.scrollIntoView({ behavior: "smooth", block: "center" })
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
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 flex items-start gap-1 text-xs text-red-600">
          <AlertCircle className="mt-px size-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : (
        hint && <p className="mt-1.5 text-xs text-neutral-500">{hint}</p>
      )}
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

export function CompanyEditorForm({
  company,
  freeeConnected = false,
  inDialog = false,
  onSuccess,
  onCancel,
  onDirtyChange,
}: {
  // 編集のときに渡す。無ければ新規登録
  company?: ProductionCompany
  // 新規登録のとき、freee にも取引先として登録されるか（案内の表示に使う）
  freeeConnected?: boolean
  inDialog?: boolean
  onSuccess?: () => void
  onCancel?: () => void
  onDirtyChange?: (dirty: boolean) => void
}) {
  const isEdit = Boolean(company)
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [state, action, isPending] = useActionState(
    async (_prev: ActionResult, fd: FormData): Promise<ActionResult> =>
      company ? updateProductionCompany(company.id, fd) : createProductionCompany(fd),
    null
  )
  const [clientErrors, setClientErrors] = useState<Errors>({})
  const [dirty, setDirty] = useState(false)

  const serverErrors = useMemo(() => fromServer(state?.error), [state])
  const errors = Object.keys(clientErrors).length ? clientErrors : serverErrors
  const errorCount = Object.keys(errors).length

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
      if (company) {
        toast.success("制作会社の情報を保存しました")
        onSuccess?.()
        return
      }
      toast.success("制作会社を登録しました", {
        description: freeeConnected ? "freeeの取引先にも登録しました。" : undefined,
      })
      router.push("/admin/production-companies")
    } else if (state.error) {
      focusFirstError(formRef.current, fromServer(state.error))
    }
  }, [state, router, company, freeeConnected, onSuccess])

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    // フォームの action に渡すと送信後に入力欄が空になる（React 19）ため、ここで受け取って送る
    e.preventDefault()
    if (isPending) return
    const fd = new FormData(e.currentTarget)
    for (const k of HALF_WIDTH_FIELDS) fd.set(k, toHalfWidth(String(fd.get(k) ?? "")))
    fd.set("contactEmail", String(fd.get("contactEmail") ?? "").trim())
    const errs = validate(fd)
    setClientErrors(errs)
    if (Object.keys(errs).length) {
      focusFirstError(formRef.current, errs)
      return
    }
    startTransition(() => action(fd))
  }

  const defaults: Record<string, string> = {
    companyName: company?.companyName ?? "",
    zipCode: company?.zipCode ?? "",
    address: company?.address ?? "",
    contactName: company?.contactName ?? "",
    contactEmail: company?.contactEmail ?? "",
    contactPhone: company?.contactPhone ?? "",
    note: company?.note ?? "",
  }
  // 会社の情報を入れる欄なので、ブラウザの自動入力（自分の名前・住所など）は出さない
  const fieldProps = (name: string) => ({
    id: name,
    name,
    defaultValue: defaults[name] ?? "",
    autoComplete: "off",
    "data-field": name,
    "aria-invalid": Boolean(errors[name]) || undefined,
    "aria-describedby": errors[name] ? `${name}-error` : undefined,
    onInput: () => {
      if (!clientErrors[name]) return
      setClientErrors((prev) => {
        const next = { ...prev }
        delete next[name]
        return next
      })
    },
  })
  const halfWidthBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const v = toHalfWidth(e.currentTarget.value)
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

      {/* freee との関係を先に伝える（新規はfreeeにも登録される／編集はfreeeには反映されない） */}
      {!isEdit && freeeConnected && (
        <p className="flex items-start gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm leading-relaxed text-neutral-700">
          <Info className="mt-0.5 size-4 shrink-0 text-blue-600" aria-hidden="true" />
          freeeと連携しているため、登録するとfreeeの取引先にも追加されます（同じ名前の取引先があれば、それと結び付けます）。
        </p>
      )}
      {isEdit && company?.freeePartnerId && (
        <p className="flex items-start gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm leading-relaxed text-neutral-700">
          <Info className="mt-0.5 size-4 shrink-0 text-blue-600" aria-hidden="true" />
          ここで変えた内容は、freeeの取引先には反映されません。freee側も変える場合は、freeeで直してください。
        </p>
      )}

      <Section
        plain={inDialog}
        title="会社の情報"
        description={isEdit ? "会社名は空にできません。" : "「必須」は会社名だけです。それ以外はあとから追加できます。"}
      >
        <Field id="companyName" label="会社名" required error={errors.companyName} className="sm:col-span-2" hint="請求書の宛名になります。「株式会社」なども正式な名前で入れてください">
          <input {...fieldProps("companyName")} placeholder="例: 株式会社東京キャスティング" className={FIELD} />
        </Field>
        <Field id="zipCode" label="郵便番号" error={errors.zipCode}>
          <input {...fieldProps("zipCode")} onBlur={halfWidthBlur} inputMode="numeric" placeholder="例: 150-0001" className={`${FIELD} sm:max-w-44`} />
        </Field>
        <div className="hidden sm:block" aria-hidden="true" />
        <Field id="address" label="住所" error={errors.address} className="sm:col-span-2">
          <input {...fieldProps("address")} placeholder="例: 東京都渋谷区神宮前1-2-3 ○○ビル5階" className={FIELD} />
        </Field>
      </Section>

      <Section plain={inDialog} title="担当者" description="請求書の送り先や、問い合わせの連絡先です。">
        <Field id="contactName" label="担当者名" error={errors.contactName} className="sm:col-span-2">
          <input {...fieldProps("contactName")} placeholder="例: 経理部 山口" className={`${FIELD} sm:max-w-sm`} />
        </Field>
        <Field id="contactEmail" label="メールアドレス" error={errors.contactEmail}>
          <input
            {...fieldProps("contactEmail")}
            type="email"
            inputMode="email"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="例: keiri@example.co.jp"
            className={FIELD}
          />
        </Field>
        <Field id="contactPhone" label="電話番号" error={errors.contactPhone}>
          <input {...fieldProps("contactPhone")} onBlur={halfWidthBlur} type="tel" inputMode="tel" placeholder="例: 03-1234-5678" className={FIELD} />
        </Field>
      </Section>

      <Section plain={inDialog} title="備考" description="社内用のメモです。請求書には載りません。">
        <Field id="note" label="備考" error={errors.note} className="sm:col-span-2">
          <textarea {...fieldProps("note")} rows={3} placeholder="例: 請求書は月末締め・翌月10日までに送付" className={TEXTAREA} />
        </Field>
      </Section>

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
            <Link href="/admin/production-companies" className={`${BTN_SECONDARY} h-10 flex-1 sm:flex-none`}>
              キャンセル
            </Link>
          )}
          <button type="submit" disabled={isPending} className={`${BTN_PRIMARY} h-10 flex-[2] sm:flex-none sm:px-8`}>
            {isPending ? (
              <>
                <Loader2 className="animate-spin" aria-hidden="true" />
                保存中…
              </>
            ) : isEdit ? (
              "保存する"
            ) : (
              "登録する"
            )}
          </button>
        </div>
      </div>
    </form>
  )
}
