"use client"

// 管理画面の案件作成フォーム（案件管理の「新規作成」ページで使う）
// 送り先・項目名は共通の JobForm と同じ（createJob）。案件詳細の編集は JobForm のまま

import { startTransition, useActionState, useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { AlertCircle, AlertTriangle, Check, ChevronDown, Loader2, Paperclip, X } from "lucide-react"
import { createJob } from "@/lib/actions/job"
import { SUBMISSION_CATEGORY_LABELS } from "@/types"
import { BTN_PRIMARY, BTN_SECONDARY, FIELD, PANEL } from "@/components/admin/styles"

type ActionResult = { success?: boolean; id?: string; error?: Record<string, string[] | undefined> } | null
type Errors = Record<string, string>

const CATEGORIES = ["PROFILE_PHOTO", "ACTING_VIDEO", "VOICE_SAMPLE", "PAST_WORK_VIDEO"] as const
const CATEGORY_HINTS: Record<string, string> = {
  PROFILE_PHOTO: "例: 最新の全身・バストアップ写真",
  ACTING_VIDEO: "例: 指定のセリフで30秒以内の演技動画",
  VOICE_SAMPLE: "例: 1分以内のナレーション音声",
  PAST_WORK_VIDEO: "例: 出演した作品の映像",
}
const TEXTAREA = `${FIELD} h-auto py-2 leading-relaxed`
const NUMBER_FIELDS = ["fee", "capacity", "ageMin", "ageMax", "heightMin", "heightMax"] as const

// 締切の時刻：「終日」はその日の23:59まで（従来の「日付だけの締切」と同じ扱い）
const TIME_OPTIONS = [
  { value: "", label: "その日の終わりまで" },
  ...Array.from({ length: 30 }, (_, i) => {
    const h = 9 + Math.floor(i / 2)
    const m = i % 2 === 0 ? "00" : "30"
    const v = `${String(h).padStart(2, "0")}:${m}`
    return { value: v, label: `${h}:${m}まで` }
  }),
]

function toHalfWidthNumber(value: string) {
  return value.replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0)).replace(/[,，\s]/g, "")
}

function validate(fd: FormData): Errors {
  const errors: Errors = {}
  const get = (k: string) => String(fd.get(k) ?? "").trim()
  if (!get("title")) errors.title = "案件名を入力してください"
  for (const k of NUMBER_FIELDS) {
    const v = get(k)
    if (v && !/^\d+$/.test(v)) errors[k] = "数字で入力してください"
  }
  const range = (min: string, max: string, label: string) => {
    const a = get(min)
    const b = get(max)
    if (a && b && /^\d+$/.test(a) && /^\d+$/.test(b) && Number(a) > Number(b)) {
      errors[max] = `${label}は「から」より大きい数にしてください`
    }
  }
  range("ageMin", "ageMax", "年齢の「まで」")
  range("heightMin", "heightMax", "身長の「まで」")
  return errors
}

function fromServer(error: Record<string, string[] | undefined> | undefined): Errors {
  if (!error) return {}
  const out: Errors = {}
  for (const [k, v] of Object.entries(error)) {
    if (!v?.[0]) continue
    out[k] = (NUMBER_FIELDS as readonly string[]).includes(k)
      ? "数字で入力してください"
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

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className={`${PANEL} p-5 sm:p-6`}>
      <h2 className="text-base font-semibold text-neutral-950">{title}</h2>
      {description && <p className="mt-1 text-sm text-neutral-500">{description}</p>}
      <div className="mt-5 grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2">{children}</div>
    </section>
  )
}

function UnitInput({ unit, ...props }: React.ComponentProps<"input"> & { unit: string }) {
  return (
    <div className="relative">
      <input {...props} type="text" inputMode="numeric" autoComplete="off" className={`${FIELD} pr-10`} />
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-neutral-400">{unit}</span>
    </div>
  )
}

// 2〜4択を横並びのボタンで選ぶ（中身はラジオボタン。フォームでそのまま送られる）
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

export function JobEditorForm() {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [state, action, isPending] = useActionState(
    async (_prev: ActionResult, fd: FormData): Promise<ActionResult> => createJob(fd),
    null
  )
  const [clientErrors, setClientErrors] = useState<Errors>({})
  const [dirty, setDirty] = useState(false)
  const [status, setStatus] = useState<"DRAFT" | "OPEN">("DRAFT")
  const [gender, setGender] = useState("")
  const [deadlineDate, setDeadlineDate] = useState("")
  const [deadlineTime, setDeadlineTime] = useState("")
  const [enabled, setEnabled] = useState<Set<string>>(new Set(["PROFILE_PHOTO"]))
  const [refFiles, setRefFiles] = useState<Record<string, string>>({})
  const [uploading, setUploading] = useState<string | null>(null)

  const serverErrors = useMemo(() => fromServer(state?.error), [state])
  const errors = Object.keys(clientErrors).length ? clientErrors : serverErrors
  const errorCount = Object.keys(errors).length

  const deadlineValue = deadlineDate ? (deadlineTime ? `${deadlineDate}T${deadlineTime}` : deadlineDate) : ""
  const deadlineIsPast = useMemo(() => {
    if (!deadlineDate) return false
    const d = new Date(`${deadlineDate}T${deadlineTime || "23:59"}:00+09:00`)
    return d.getTime() < Date.now()
  }, [deadlineDate, deadlineTime])

  const submitLabel = status === "OPEN" ? "作成して募集を始める" : "下書きとして保存"

  // 入力途中で画面を閉じよう・再読み込みしようとしたら確認を出す
  const saved = Boolean(state?.success)
  useEffect(() => {
    if (!dirty || saved) return
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener("beforeunload", onBeforeUnload)
    return () => window.removeEventListener("beforeunload", onBeforeUnload)
  }, [dirty, saved])

  // 作成できたら、その案件の詳細へ（日程の追加などをすぐできるように）
  const handledRef = useRef<ActionResult>(null)
  useEffect(() => {
    if (!state || handledRef.current === state) return
    handledRef.current = state
    if (state.success) {
      toast.success(status === "OPEN" ? "案件を作成し、募集を始めました" : "案件を下書きとして保存しました", {
        description: "続けて、オーディション日・撮影日などの日程を追加できます。",
      })
      router.push(state.id ? `/admin/jobs/${state.id}` : "/admin/jobs")
    } else if (state.error) {
      focusFirstError(formRef.current, fromServer(state.error))
    }
  }, [state, router, status])

  const handleRefFileUpload = useCallback(async (cat: string, file: File) => {
    setUploading(cat)
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
      setRefFiles((prev) => ({ ...prev, [cat]: url }))
    } catch (e) {
      toast.error("ファイルをアップロードできませんでした", {
        description: e instanceof Error ? e.message : undefined,
      })
    } finally {
      setUploading(null)
    }
  }, [])

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

  const fieldProps = (name: string) => ({
    id: name,
    name,
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
  const numberBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const v = toHalfWidthNumber(e.currentTarget.value)
    if (v !== e.currentTarget.value) e.currentTarget.value = v
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} onChange={() => setDirty(true)} noValidate className="space-y-5">
      {errorCount > 0 && (
        <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <p>入力内容に確認が必要な項目が{errorCount}件あります。赤字の項目を直してから、もう一度押してください。</p>
        </div>
      )}

      <Section title="案件の内容" description="「必須」は案件名だけです。それ以外はあとから追加・変更できます。">
        <Field id="title" label="案件名" required error={errors.title} className="sm:col-span-2" hint="一覧やタレントへのお知らせに表示されます">
          <input {...fieldProps("title")} autoComplete="off" placeholder="例: 飲料メーカー TVCM 家族役" className={FIELD} />
        </Field>
        <Field id="description" label="案件の説明" error={errors.description} className="sm:col-span-2">
          <textarea {...fieldProps("description")} rows={4} placeholder="撮影内容・役柄の説明など" className={TEXTAREA} />
        </Field>
        <Field id="location" label="場所" error={errors.location}>
          <input {...fieldProps("location")} autoComplete="off" placeholder="例: 東京都渋谷区（スタジオ）" className={FIELD} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field id="fee" label="報酬" error={errors.fee}>
            <UnitInput {...fieldProps("fee")} unit="円" onBlur={numberBlur} placeholder="例: 30000" />
          </Field>
          <Field id="capacity" label="募集人数" error={errors.capacity}>
            <UnitInput {...fieldProps("capacity")} unit="名" onBlur={numberBlur} />
          </Field>
        </div>
      </Section>

      <Section
        title="応募できる人の条件"
        description="入れた条件に合うタレントが「条件に合う人」として表示され、募集開始のお知らせが届きます。空欄なら条件なしです。"
      >
        <div className="sm:col-span-2">
          <p className="mb-1.5 text-sm font-medium text-neutral-900">性別</p>
          <Choice
            name="genderReq"
            label="性別"
            value={gender}
            onChange={setGender}
            options={[
              { value: "", label: "指定なし" },
              { value: "FEMALE", label: "女性" },
              { value: "MALE", label: "男性" },
              { value: "OTHER", label: "その他" },
            ]}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field id="ageMin" label="年齢（から）" error={errors.ageMin}>
            <UnitInput {...fieldProps("ageMin")} unit="歳" onBlur={numberBlur} />
          </Field>
          <Field id="ageMax" label="年齢（まで）" error={errors.ageMax}>
            <UnitInput {...fieldProps("ageMax")} unit="歳" onBlur={numberBlur} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field id="heightMin" label="身長（から）" error={errors.heightMin}>
            <UnitInput {...fieldProps("heightMin")} unit="cm" onBlur={numberBlur} />
          </Field>
          <Field id="heightMax" label="身長（まで）" error={errors.heightMax}>
            <UnitInput {...fieldProps("heightMax")} unit="cm" onBlur={numberBlur} />
          </Field>
        </div>
      </Section>

      <Section title="応募締切" description="締切を過ぎると、自動で「募集終了」になります。オーディション日・撮影日は、作成後の画面で追加できます。">
        <input type="hidden" name="deadline" value={deadlineValue} />
        <Field id="deadlineDate" label="日付" hint={deadlineDate ? undefined : "空欄なら締切なし"}>
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
              {TIME_OPTIONS.map((t) => (
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
            締切がすでに過ぎた日時になっています。このまま作成すると、すぐに「募集終了」になります。
          </p>
        )}
      </Section>

      <section className={`${PANEL} p-5 sm:p-6`}>
        <h2 className="text-base font-semibold text-neutral-950">応募時に提出してもらうもの</h2>
        <p className="mt-1 text-sm text-neutral-500">チェックを入れたものを、タレントが応募するときに提出します。</p>
        <ul className="mt-5 space-y-2">
          {CATEGORIES.map((cat) => {
            const on = enabled.has(cat)
            return (
              <li key={cat} className={`rounded-xl border transition-colors ${on ? "border-neutral-300" : "border-neutral-200"}`}>
                <label className="flex cursor-pointer items-center gap-3 p-3 sm:p-4">
                  <span className="relative flex size-5 shrink-0 items-center justify-center">
                    <input
                      type="checkbox"
                      name={`req_${cat}_enabled`}
                      checked={on}
                      onChange={() =>
                        setEnabled((prev) => {
                          const next = new Set(prev)
                          if (next.has(cat)) next.delete(cat)
                          else next.add(cat)
                          return next
                        })
                      }
                      className="peer absolute inset-0 cursor-pointer appearance-none rounded-[5px] border border-neutral-400 bg-white checked:border-neutral-950 checked:bg-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950/30"
                    />
                    <Check className="pointer-events-none relative size-3.5 text-white opacity-0 peer-checked:opacity-100" aria-hidden="true" />
                  </span>
                  <span className={`text-sm font-medium ${on ? "text-neutral-950" : "text-neutral-600"}`}>
                    {SUBMISSION_CATEGORY_LABELS[cat]}
                  </span>
                </label>
                {on && (
                  <div className="grid grid-cols-1 gap-4 border-t border-neutral-100 p-3 sm:grid-cols-2 sm:p-4">
                    <Field id={`req_${cat}_description`} label="補足の説明" className="sm:col-span-2">
                      <input
                        id={`req_${cat}_description`}
                        name={`req_${cat}_description`}
                        autoComplete="off"
                        placeholder={CATEGORY_HINTS[cat]}
                        className={FIELD}
                      />
                    </Field>
                    <Field id={`req_${cat}_referenceUrl`} label="参考資料のURL">
                      <input
                        id={`req_${cat}_referenceUrl`}
                        name={`req_${cat}_referenceUrl`}
                        type="url"
                        inputMode="url"
                        autoComplete="off"
                        autoCapitalize="none"
                        placeholder="https://..."
                        className={FIELD}
                      />
                    </Field>
                    <div className="min-w-0">
                      <p className="mb-1.5 text-sm font-medium text-neutral-900">参考ファイル</p>
                      <input type="hidden" name={`req_${cat}_referenceFile`} value={refFiles[cat] ?? ""} />
                      {refFiles[cat] ? (
                        <div className="flex h-9 items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 text-sm">
                          <Paperclip className="size-4 shrink-0 text-neutral-400" aria-hidden="true" />
                          <span className="min-w-0 flex-1 truncate">{refFiles[cat].split("/").pop()}</span>
                          <button
                            type="button"
                            aria-label="参考ファイルを外す"
                            onClick={() =>
                              setRefFiles((prev) => {
                                const next = { ...prev }
                                delete next[cat]
                                return next
                              })
                            }
                            className="inline-flex size-6 items-center justify-center rounded text-neutral-500 hover:bg-neutral-200 hover:text-neutral-950"
                          >
                            <X className="size-4" aria-hidden="true" />
                          </button>
                        </div>
                      ) : (
                        <label className={`${BTN_SECONDARY} w-full cursor-pointer ${uploading === cat ? "pointer-events-none opacity-60" : ""}`}>
                          {uploading === cat ? (
                            <>
                              <Loader2 className="animate-spin" aria-hidden="true" />
                              アップロード中…
                            </>
                          ) : (
                            <>
                              <Paperclip aria-hidden="true" />
                              ファイルを選ぶ
                            </>
                          )}
                          <input
                            type="file"
                            accept=".pdf,.mp4,.mov,.webm,.jpg,.jpeg,.png,.webp"
                            className="sr-only"
                            disabled={uploading === cat}
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) handleRefFileUpload(cat, file)
                              e.target.value = ""
                            }}
                          />
                        </label>
                      )}
                      <p className="mt-1.5 text-xs text-neutral-500">PDF・動画・画像</p>
                    </div>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      </section>

      <Section title="備考" description="社内用のメモです。">
        <Field id="note" label="備考" error={errors.note} className="sm:col-span-2">
          <textarea {...fieldProps("note")} rows={3} className={TEXTAREA} />
        </Field>
      </Section>

      <section className={`${PANEL} p-5 sm:p-6`}>
        <h2 className="text-base font-semibold text-neutral-950">作成したあとの状態</h2>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2" role="radiogroup" aria-label="作成したあとの状態">
          {(
            [
              { value: "DRAFT", title: "下書きとして保存", desc: "まだタレントには公開されません。内容を見直してから募集を始められます。" },
              { value: "OPEN", title: "すぐに募集を始める", desc: "タレントに公開され、条件に合うタレントにLINEでお知らせが届きます。" },
            ] as const
          ).map((o) => {
            const active = status === o.value
            return (
              <label
                key={o.value}
                className={`flex cursor-pointer gap-3 rounded-xl border p-4 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-neutral-950/30 ${
                  active ? "border-neutral-950 bg-neutral-50" : "border-neutral-200 hover:border-neutral-300"
                }`}
              >
                <input
                  type="radio"
                  name="status"
                  value={o.value}
                  checked={active}
                  onChange={() => setStatus(o.value)}
                  className="mt-0.5 size-4 shrink-0 accent-neutral-950"
                />
                <span>
                  <span className="block text-sm font-medium text-neutral-950">{o.title}</span>
                  <span className="mt-1 block text-xs leading-relaxed text-neutral-500">{o.desc}</span>
                </span>
              </label>
            )
          })}
        </div>
      </section>

      {/* 長いフォームなので、作成ボタンは画面の下に常に出しておく */}
      <div className="sticky -bottom-3 z-10 -mx-3 border-t border-neutral-200 bg-white/95 px-3 py-3 sm:-bottom-6 sm:-mx-6 sm:px-6">
        <div className="mx-auto flex max-w-3xl items-center justify-end gap-2">
          <Link href="/admin/jobs" className={`${BTN_SECONDARY} h-10 flex-1 sm:flex-none`}>
            キャンセル
          </Link>
          <button type="submit" disabled={isPending || Boolean(uploading)} className={`${BTN_PRIMARY} h-10 flex-[2] sm:flex-none sm:px-8`}>
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
