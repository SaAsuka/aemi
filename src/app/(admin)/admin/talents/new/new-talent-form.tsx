"use client"

// タレント新規登録フォーム（管理画面の新規登録ページ専用）
// 送り先・項目名は共通の TalentForm と同じ（createTalent）。編集画面・マイページは TalentForm のまま

import { startTransition, useActionState, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { AlertCircle, ChevronDown, Loader2 } from "lucide-react"
import { createTalent } from "@/lib/actions/talent"
import { TALENT_STATUS_LABELS } from "@/types"
import { BTN_PRIMARY, BTN_SECONDARY, FIELD, PANEL } from "@/components/admin/styles"

type ActionResult = { success?: boolean; error?: Record<string, string[] | undefined> } | null
type Errors = Record<string, string>

const TEXTAREA = `${FIELD} h-auto py-2 leading-relaxed`
const NUMBER_FIELDS = [
  { name: "height", label: "身長" },
  { name: "bust", label: "バスト" },
  { name: "waist", label: "ウエスト" },
  { name: "hip", label: "ヒップ" },
] as const

// ひらがなで入力されたらカタカナに直す（フリガナ欄用）
function toKatakana(value: string) {
  return value.replace(/[ぁ-ゖ]/g, (c) => String.fromCharCode(c.charCodeAt(0) + 0x60))
}

// 全角の数字・小数点を半角に直す（日本語入力のまま数字を打っても通るように）
function toHalfWidthNumber(value: string) {
  return value.replace(/[０-９．]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0)).trim()
}
const HALF_WIDTH_FIELDS = ["height", "bust", "waist", "hip", "shoeSize", "bankAccountNumber"]

function calcAge(y: number, m: number, d: number) {
  const now = new Date()
  let age = now.getFullYear() - y
  if (now.getMonth() + 1 < m || (now.getMonth() + 1 === m && now.getDate() < d)) age--
  return age
}

// 送信前のチェック（ブラウザ標準のチェックには頼らない）
function validate(fd: FormData): Errors {
  const errors: Errors = {}
  const get = (k: string) => String(fd.get(k) ?? "").trim()
  if (!get("lastName")) errors.lastName = "姓を入力してください"
  if (!get("firstName")) errors.firstName = "名を入力してください"
  if (!get("lastNameKana")) errors.lastNameKana = "セイを入力してください"
  if (!get("firstNameKana")) errors.firstNameKana = "メイを入力してください"
  const email = get("email")
  if (!email) errors.email = "メールアドレスを入力してください"
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "メールアドレスの形式が正しくありません（例: name@example.com）"
  for (const f of NUMBER_FIELDS) {
    const v = get(f.name)
    if (v && !/^[1-9]\d*$/.test(v)) errors[f.name] = "数字で入力してください（例: 165）"
  }
  const shoe = get("shoeSize")
  if (shoe && !(Number(shoe) > 0)) errors.shoeSize = "数字で入力してください（例: 24.5）"
  if (fd.get("birthDatePartial") === "1") errors.birthDate = "生年月日は年・月・日をすべて選んでください"
  return errors
}

// サーバーから返ったエラーを日本語の1文にそろえる
function fromServer(error: Record<string, string[] | undefined> | undefined): Errors {
  if (!error) return {}
  const out: Errors = {}
  for (const [k, v] of Object.entries(error)) {
    if (!v?.[0]) continue
    const num = NUMBER_FIELDS.find((f) => f.name === k)
    out[k] = num ? "数字で入力してください（例: 165）" : /[a-zA-Z]/.test(v[0]) ? "入力内容を確認してください" : v[0]
  }
  return out
}

// 最初にエラーが出ている欄へスクロールしてカーソルを置く
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
  className,
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
    <div className={`min-w-0 ${className ?? ""}`}>
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

function SelectBox({ className = "", ...props }: React.ComponentProps<"select">) {
  return (
    <div className="relative">
      <select {...props} className={`${FIELD} appearance-none pr-9 ${className}`} />
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-neutral-500"
        aria-hidden="true"
      />
    </div>
  )
}

function UnitInput({ unit, ...props }: React.ComponentProps<"input"> & { unit: string }) {
  return (
    <div className="relative">
      <input {...props} className={`${FIELD} pr-10`} />
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-neutral-400">
        {unit}
      </span>
    </div>
  )
}

export function NewTalentForm() {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [state, action, isPending] = useActionState(
    async (_prev: ActionResult, fd: FormData): Promise<ActionResult> => createTalent(fd),
    null
  )
  const [clientErrors, setClientErrors] = useState<Errors>({})
  const [dirty, setDirty] = useState(false)
  const [birth, setBirth] = useState({ y: "", m: "", d: "" })

  const serverErrors = useMemo(() => fromServer(state?.error), [state])
  const errors = Object.keys(clientErrors).length ? clientErrors : serverErrors
  const errorCount = Object.keys(errors).length

  const years = useMemo(() => {
    const now = new Date().getFullYear()
    return Array.from({ length: now - 1939 }, (_, i) => String(now - i))
  }, [])
  const daysInMonth = birth.y && birth.m ? new Date(Number(birth.y), Number(birth.m), 0).getDate() : 31
  const birthComplete = Boolean(birth.y && birth.m && birth.d)
  const birthPartial = !birthComplete && Boolean(birth.y || birth.m || birth.d)
  const birthValue = birthComplete
    ? `${birth.y}-${birth.m.padStart(2, "0")}-${birth.d.padStart(2, "0")}`
    : ""
  const age = birthComplete ? calcAge(Number(birth.y), Number(birth.m), Number(birth.d)) : null

  // 入力途中で画面を閉じよう・再読み込みしようとしたら確認を出す
  const saved = Boolean(state?.success)
  useEffect(() => {
    if (!dirty || saved) return
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener("beforeunload", onBeforeUnload)
    return () => window.removeEventListener("beforeunload", onBeforeUnload)
  }, [dirty, saved])

  // 登録できたら一覧へ。できなかったら最初のエラー欄へ移動
  useEffect(() => {
    if (!state) return
    if (state.success) {
      const fd = formRef.current ? new FormData(formRef.current) : null
      const name = fd ? `${fd.get("lastName") ?? ""} ${fd.get("firstName") ?? ""}`.trim() : ""
      toast.success(name ? `${name}さんを登録しました` : "タレントを登録しました")
      router.push("/admin/talents")
    } else if (state.error) {
      focusFirstError(formRef.current, fromServer(state.error))
    }
  }, [state, router])

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    // フォームの action に渡すと、送信後に入力欄が空になってしまう（React 19 の仕様）ため、
    // ここで受け取って送る。エラーで戻ってきても入力した内容は消えない
    e.preventDefault()
    if (isPending) return
    const fd = new FormData(e.currentTarget)
    for (const name of HALF_WIDTH_FIELDS) fd.set(name, toHalfWidthNumber(String(fd.get(name) ?? "")))
    fd.set("birthDatePartial", birthPartial ? "1" : "")
    const errs = validate(fd)
    setClientErrors(errs)
    if (Object.keys(errs).length) {
      focusFirstError(formRef.current, errs)
      return
    }
    fd.delete("birthDatePartial")
    startTransition(() => action(fd))
  }

  const describedBy = (name: string) => (errors[name] ? `${name}-error` : undefined)
  const fieldProps = (name: string) => ({
    id: name,
    name,
    "data-field": name,
    "aria-invalid": Boolean(errors[name]) || undefined,
    "aria-describedby": describedBy(name),
  })
  const clearError = (name: string) => {
    if (!clientErrors[name]) return
    setClientErrors((prev) => {
      const next = { ...prev }
      delete next[name]
      return next
    })
  }
  const numberBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const v = toHalfWidthNumber(e.currentTarget.value)
    if (v !== e.currentTarget.value) e.currentTarget.value = v
  }
  const kanaBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const v = toKatakana(e.currentTarget.value)
    if (v !== e.currentTarget.value) e.currentTarget.value = v
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      onChange={() => setDirty(true)}
      noValidate
      className="space-y-5"
    >
      {errorCount > 0 && (
        <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <p>
            入力内容に確認が必要な項目が{errorCount}件あります。赤字の項目を直してから、もう一度「登録する」を押してください。
          </p>
        </div>
      )}

      <Section title="基本情報" description="「必須」の項目だけ入れれば登録できます。それ以外はあとから追加・変更できます。">
        <Field id="lastName" label="姓" required error={errors.lastName}>
          <input {...fieldProps("lastName")} autoComplete="off" placeholder="例: 山田" className={FIELD} onInput={() => clearError("lastName")} />
        </Field>
        <Field id="firstName" label="名" required error={errors.firstName}>
          <input {...fieldProps("firstName")} autoComplete="off" placeholder="例: 花子" className={FIELD} onInput={() => clearError("firstName")} />
        </Field>
        <Field id="lastNameKana" label="セイ" required error={errors.lastNameKana} hint="ひらがなで入力してもカタカナに直ります">
          <input {...fieldProps("lastNameKana")} autoComplete="off" placeholder="例: ヤマダ" className={FIELD} onBlur={kanaBlur} onInput={() => clearError("lastNameKana")} />
        </Field>
        <Field id="firstNameKana" label="メイ" required error={errors.firstNameKana}>
          <input {...fieldProps("firstNameKana")} autoComplete="off" placeholder="例: ハナコ" className={FIELD} onBlur={kanaBlur} onInput={() => clearError("firstNameKana")} />
        </Field>
        <Field id="email" label="メールアドレス" required error={errors.email} hint="タレント本人のログインやお知らせに使います。すでに登録されているメールアドレスは使えません（1人につき1つ）">
          <input
            {...fieldProps("email")}
            type="email"
            inputMode="email"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="例: hanako@example.com"
            className={FIELD}
            onInput={() => clearError("email")}
          />
        </Field>
        <Field id="phone" label="電話番号" error={errors.phone}>
          <input {...fieldProps("phone")} type="tel" inputMode="tel" autoComplete="off" placeholder="例: 090-1234-5678" className={FIELD} />
        </Field>
        <Field id="stageName" label="芸名" error={errors.stageName} hint="コンポジPDFに表記される名前です">
          <input {...fieldProps("stageName")} autoComplete="off" className={FIELD} />
        </Field>
        <Field id="nameRomaji" label="ローマ字名" error={errors.nameRomaji}>
          <input {...fieldProps("nameRomaji")} autoComplete="off" autoCapitalize="words" placeholder="例: Hanako Yamada" className={FIELD} />
        </Field>
      </Section>

      <Section title="プロフィール">
        <Field id="gender" label="性別" error={errors.gender}>
          <SelectBox {...fieldProps("gender")} defaultValue="">
            <option value="">選択してください</option>
            <option value="FEMALE">女性</option>
            <option value="MALE">男性</option>
            <option value="OTHER">その他</option>
          </SelectBox>
        </Field>
        <Field id="birthYear" label="生年月日" error={errors.birthDate} hint={age !== null && age >= 0 ? `${age}歳` : undefined}>
          <input type="hidden" name="birthDate" value={birthValue} />
          <div className="grid grid-cols-[1.4fr_1fr_1fr] gap-2" data-field="birthDate" tabIndex={-1}>
            <SelectBox
              id="birthYear"
              aria-label="生まれた年"
              value={birth.y}
              onChange={(e) => {
                setBirth((b) => ({ ...b, y: e.target.value }))
                clearError("birthDate")
              }}
            >
              <option value="">年</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}年
                </option>
              ))}
            </SelectBox>
            <SelectBox
              aria-label="生まれた月"
              value={birth.m}
              onChange={(e) => {
                setBirth((b) => ({ ...b, m: e.target.value }))
                clearError("birthDate")
              }}
            >
              <option value="">月</option>
              {Array.from({ length: 12 }, (_, i) => String(i + 1)).map((m) => (
                <option key={m} value={m}>
                  {m}月
                </option>
              ))}
            </SelectBox>
            <SelectBox
              aria-label="生まれた日"
              value={Number(birth.d) > daysInMonth ? "" : birth.d}
              onChange={(e) => {
                setBirth((b) => ({ ...b, d: e.target.value }))
                clearError("birthDate")
              }}
            >
              <option value="">日</option>
              {Array.from({ length: daysInMonth }, (_, i) => String(i + 1)).map((d) => (
                <option key={d} value={d}>
                  {d}日
                </option>
              ))}
            </SelectBox>
          </div>
        </Field>

        <div className="grid grid-cols-2 gap-x-4 gap-y-5 sm:col-span-2 sm:grid-cols-5">
          {NUMBER_FIELDS.map((f) => (
            <Field key={f.name} id={f.name} label={f.label} error={errors[f.name]}>
              <UnitInput
                {...fieldProps(f.name)}
                unit="cm"
                inputMode="numeric"
                autoComplete="off"
                onBlur={numberBlur}
                onInput={() => clearError(f.name)}
              />
            </Field>
          ))}
          <Field id="shoeSize" label="靴サイズ" error={errors.shoeSize}>
            <UnitInput
              {...fieldProps("shoeSize")}
              unit="cm"
              inputMode="decimal"
              autoComplete="off"
              onBlur={numberBlur}
              onInput={() => clearError("shoeSize")}
            />
          </Field>
        </div>

        <Field id="category" label="芸能カテゴリ" error={errors.category}>
          <input {...fieldProps("category")} autoComplete="off" placeholder="例: 俳優、モデル、声優" className={FIELD} />
        </Field>
        <Field id="birthplace" label="出身地" error={errors.birthplace}>
          <input {...fieldProps("birthplace")} autoComplete="off" placeholder="例: 東京都" className={FIELD} />
        </Field>
        <Field id="nearestStation" label="最寄駅" error={errors.nearestStation}>
          <input {...fieldProps("nearestStation")} autoComplete="off" placeholder="例: 渋谷駅" className={FIELD} />
        </Field>
        <Field id="address" label="現住所" error={errors.address}>
          <input {...fieldProps("address")} autoComplete="off" className={FIELD} />
        </Field>
      </Section>

      <Section title="経歴・特技">
        <Field id="skills" label="特技" error={errors.skills}>
          <input {...fieldProps("skills")} autoComplete="off" placeholder="例: インドネシア語、殺陣" className={FIELD} />
        </Field>
        <Field id="hobbies" label="趣味" error={errors.hobbies}>
          <input {...fieldProps("hobbies")} autoComplete="off" placeholder="例: 釣り、料理、ゴルフ" className={FIELD} />
        </Field>
        <Field id="qualifications" label="資格" error={errors.qualifications} className="sm:col-span-2">
          <input {...fieldProps("qualifications")} autoComplete="off" placeholder="例: 普通自動車免許、英検2級" className={FIELD} />
        </Field>
        <Field id="career" label="経歴" error={errors.career} className="sm:col-span-2">
          <textarea {...fieldProps("career")} rows={5} placeholder="出演歴・受賞歴など" className={TEXTAREA} />
        </Field>
        <Field id="representativeWork" label="代表作" error={errors.representativeWork} className="sm:col-span-2">
          <textarea {...fieldProps("representativeWork")} rows={3} placeholder="代表的な出演作品" className={TEXTAREA} />
        </Field>
      </Section>

      <Section title="SNS・Webサイト">
        <Field id="instagramUrl" label="Instagram" error={errors.instagramUrl}>
          <input {...fieldProps("instagramUrl")} type="url" inputMode="url" autoComplete="off" autoCapitalize="none" placeholder="https://instagram.com/..." className={FIELD} />
        </Field>
        <Field id="xUrl" label="X（旧Twitter）" error={errors.xUrl}>
          <input {...fieldProps("xUrl")} type="url" inputMode="url" autoComplete="off" autoCapitalize="none" placeholder="https://x.com/..." className={FIELD} />
        </Field>
        <Field id="tiktokUrl" label="TikTok" error={errors.tiktokUrl}>
          <input {...fieldProps("tiktokUrl")} type="url" inputMode="url" autoComplete="off" autoCapitalize="none" placeholder="https://tiktok.com/@..." className={FIELD} />
        </Field>
        <Field id="websiteUrl" label="公式サイトなど" error={errors.websiteUrl}>
          <input {...fieldProps("websiteUrl")} type="url" inputMode="url" autoComplete="off" autoCapitalize="none" placeholder="https://..." className={FIELD} />
        </Field>
      </Section>

      <Section title="振込先" description="ギャラのお振込みに使います。わからなければ空欄のまま登録できます。">
        <Field id="bankName" label="銀行名" error={errors.bankName}>
          <input {...fieldProps("bankName")} autoComplete="off" placeholder="例: 三菱UFJ銀行" className={FIELD} />
        </Field>
        <Field id="bankBranch" label="支店名" error={errors.bankBranch}>
          <input {...fieldProps("bankBranch")} autoComplete="off" placeholder="例: 渋谷支店" className={FIELD} />
        </Field>
        <Field id="bankAccountType" label="種別" error={errors.bankAccountType}>
          <SelectBox {...fieldProps("bankAccountType")} defaultValue="">
            <option value="">選択してください</option>
            <option value="普通">普通</option>
            <option value="当座">当座</option>
          </SelectBox>
        </Field>
        <Field id="bankAccountNumber" label="口座番号" error={errors.bankAccountNumber}>
          <input {...fieldProps("bankAccountNumber")} inputMode="numeric" autoComplete="off" onBlur={numberBlur} placeholder="例: 1234567" className={FIELD} />
        </Field>
        <Field id="bankAccountHolder" label="口座名義" error={errors.bankAccountHolder} hint="通帳に書かれているカタカナの名義" className="sm:col-span-2">
          <input {...fieldProps("bankAccountHolder")} autoComplete="off" placeholder="例: ヤマダ ハナコ" className={FIELD} />
        </Field>
      </Section>

      <Section title="管理用" description="タレント本人には表示されません。">
        <Field id="status" label="ステータス" error={errors.status}>
          <SelectBox {...fieldProps("status")} defaultValue="ACTIVE">
            {Object.entries(TALENT_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </SelectBox>
        </Field>
        <Field id="lineUserId" label="LINE ユーザーID" error={errors.lineUserId} hint="LINE連携済みの場合のみ。通常は空欄で大丈夫です">
          <input {...fieldProps("lineUserId")} autoComplete="off" autoCapitalize="none" spellCheck={false} className={FIELD} />
        </Field>
        <Field id="note" label="備考" error={errors.note} className="sm:col-span-2">
          <textarea {...fieldProps("note")} rows={3} placeholder="社内メモなど" className={TEXTAREA} />
        </Field>
      </Section>

      {/* 長いフォームなので、登録ボタンは画面の下に常に出しておく */}
      <div className="sticky -bottom-3 z-10 -mx-3 border-t border-neutral-200 bg-white/95 px-3 py-3 sm:-bottom-6 sm:-mx-6 sm:px-6">
        <div className="mx-auto flex max-w-3xl items-center justify-end gap-2">
          <Link href="/admin/talents" className={`${BTN_SECONDARY} h-10 flex-1 sm:flex-none`}>
            キャンセル
          </Link>
          <button type="submit" disabled={isPending} className={`${BTN_PRIMARY} h-10 flex-[2] sm:flex-none sm:px-8`}>
            {isPending ? (
              <>
                <Loader2 className="animate-spin" aria-hidden="true" />
                登録中…
              </>
            ) : (
              "登録する"
            )}
          </button>
        </div>
      </div>
    </form>
  )
}
