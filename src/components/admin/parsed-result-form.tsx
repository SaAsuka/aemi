"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Check, ChevronDown, Loader2 } from "lucide-react"
import { BTN_GHOST, BTN_PRIMARY, BTN_SECONDARY, FIELD } from "@/components/admin/styles"
import { applyParsedJobs } from "@/lib/actions/apply-parsed-job"
import type { ParseResult, ParsedCommon, ParsedRole, ParsedTalentEntry } from "@/lib/validations/parsed-job"

const GENDER_LABELS: Record<string, string> = {
  MALE: "男性",
  FEMALE: "女性",
  OTHER: "その他",
}

const GENDER_OPTIONS = [
  { value: "NONE", label: "指定なし" },
  { value: "MALE", label: "男性" },
  { value: "FEMALE", label: "女性" },
  { value: "OTHER", label: "その他" },
] as const

const STATUS_LABELS: Record<string, string> = {
  ACCEPTED: "合格",
  REJECTED: "不合格",
  PENDING: "選考中",
}

function buildTalentNote(talents: ParsedTalentEntry[]): string {
  if (talents.length === 0) return ""
  const lines = talents.map((t) => {
    const parts = [t.name, STATUS_LABELS[t.status] ?? t.status]
    if (t.date) parts.push(t.date)
    if (t.startTime) parts.push(t.startTime)
    if (t.location) parts.push(t.location)
    return parts.join(" / ")
  })
  return `【タレント】\n${lines.join("\n")}`
}

function toDatetimeLocal(v: string | null | undefined): string {
  if (!v) return ""
  return v.slice(0, 16)
}

type RoleState = {
  checked: boolean
  expanded: boolean
  mode: "create" | "existing"
  existingJobId: string
  title: string
  genderReq: string
  ageMin: string
  ageMax: string
  heightMin: string
  heightMax: string
  fee: string
  capacity: string
  note: string
}

function initRoleState(role: ParsedRole, existingJobId: string | null): RoleState {
  const talentNote = buildTalentNote(role.talents)
  const roleNote = role.note ?? ""
  const combinedNote = [roleNote, talentNote].filter(Boolean).join("\n\n")

  return {
    checked: true,
    expanded: false,
    mode: existingJobId ? "existing" : "create",
    existingJobId: existingJobId ?? "",
    title: role.title,
    genderReq: role.genderReq ?? "NONE",
    ageMin: role.ageMin?.toString() ?? "",
    ageMax: role.ageMax?.toString() ?? "",
    heightMin: role.heightMin?.toString() ?? "",
    heightMax: role.heightMax?.toString() ?? "",
    fee: role.fee?.toString() ?? "",
    capacity: role.capacity?.toString() ?? "",
    note: combinedNote,
  }
}

function RoleSummary({ role }: { role: RoleState }) {
  const parts: string[] = []
  if (role.genderReq !== "NONE") parts.push(GENDER_LABELS[role.genderReq] ?? role.genderReq)
  if (role.ageMin || role.ageMax) {
    parts.push(`${role.ageMin || "?"}〜${role.ageMax || "?"}歳`)
  }
  if (role.fee) parts.push(`¥${Number(role.fee).toLocaleString()}`)
  if (role.capacity) parts.push(`${role.capacity}名`)
  return (
    <span className="text-xs text-neutral-500">
      {parts.length > 0 ? parts.join(" ・ ") : "条件・報酬は未設定"}
    </span>
  )
}

const REQUIREMENT_LABELS: Record<string, string> = {
  ACTING_VIDEO: "課題演技動画",
  VOICE_SAMPLE: "ボイスサンプル",
  PAST_WORK_VIDEO: "過去出演動画",
  PROFILE_PHOTO: "宣材写真",
}
const DATE_TYPE_LABELS: Record<string, string> = { AUDITION: "オーディション", SHOOTING: "撮影" }
const TEXTAREA = `${FIELD} h-auto py-2 leading-relaxed`

// 全角の数字を半角に直す（数字の欄用。日本語入力のまま打っても通るように）
function toHalfWidthDigits(value: string) {
  return value.replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0)).replace(/[^\d]/g, "")
}

function Field({ label, htmlFor, hint, className = "", children }: { label: string; htmlFor: string; hint?: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={`min-w-0 ${className}`}>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-neutral-900">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1.5 text-xs text-neutral-500">{hint}</p>}
    </div>
  )
}

function NumberInput({ id, value, onChange, unit }: { id: string; value: string; onChange: (v: string) => void; unit?: string }) {
  return (
    <div className="relative">
      <input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(toHalfWidthDigits(e.target.value))}
        className={`${FIELD} ${unit ? "pr-10" : ""}`}
      />
      {unit && (
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-neutral-400">{unit}</span>
      )}
    </div>
  )
}

export function ParsedResultForm({
  data,
  onSuccess,
}: {
  data: ParseResult
  onSuccess: () => void
}) {
  const router = useRouter()
  const [common, setCommon] = useState({
    location: data.common.location ?? "",
    deadline: toDatetimeLocal(data.common.deadline),
    description: data.common.description ?? "",
    commonNote: data.common.note ?? "",
    clientCompanyName: data.common.clientCompanyName ?? "",
  })
  const [roles, setRoles] = useState<RoleState[]>(
    data.jobs.map((j) => initRoleState(j.role, j.existingJobId))
  )
  const [saving, setSaving] = useState(false)

  const checkedCount = roles.filter((r) => r.checked).length

  const updateCommon = (key: keyof typeof common, value: string) => {
    setCommon((prev) => ({ ...prev, [key]: value }))
  }

  const updateRole = (index: number, updates: Partial<RoleState>) => {
    setRoles((prev) => prev.map((r, i) => (i === index ? { ...r, ...updates } : r)))
  }

  const handleSubmit = async () => {
    const selected = roles.filter((r) => r.checked)
    if (selected.length === 0) {
      toast.error("登録する役柄を選択してください")
      return
    }
    for (const r of selected) {
      if (!r.title.trim()) {
        toast.error("案件名が未入力の役柄があります")
        return
      }
    }

    setSaving(true)

    const inputs = selected.map((r) => {
      const mergedNote = [common.commonNote, r.note].filter(Boolean).join("\n\n")
      return {
        mode: r.mode as "create" | "existing",
        existingJobId: r.mode === "existing" ? r.existingJobId : undefined,
        title: r.title,
        description: common.description || undefined,
        location: common.location || undefined,
        fee: r.fee ? parseInt(r.fee, 10) : undefined,
        genderReq: r.genderReq !== "NONE" ? (r.genderReq as "MALE" | "FEMALE" | "OTHER") : undefined,
        ageMin: r.ageMin ? parseInt(r.ageMin, 10) : undefined,
        ageMax: r.ageMax ? parseInt(r.ageMax, 10) : undefined,
        heightMin: r.heightMin ? parseInt(r.heightMin, 10) : undefined,
        heightMax: r.heightMax ? parseInt(r.heightMax, 10) : undefined,
        deadline: common.deadline || undefined,
        capacity: r.capacity ? parseInt(r.capacity, 10) : undefined,
        note: mergedNote || undefined,
        dates: data.common.dates,
        requirements: data.common.requirements as ("ACTING_VIDEO" | "VOICE_SAMPLE" | "PAST_WORK_VIDEO" | "PROFILE_PHOTO")[],
      }
    })

    const result = await applyParsedJobs(inputs)
    setSaving(false)

    if (result.success) {
      toast.success(`${result.count}件の案件を保存しました`)
      router.refresh()
      onSuccess()
    } else {
      toast.error(result.error)
    }
  }

  const allChecked = roles.every((r) => r.checked)

  return (
    <div className="space-y-6">
      {/* 共通の情報 */}
      <section className="space-y-4">
        <div>
          <h3 className="text-base font-semibold text-neutral-950">共通の情報</h3>
          <p className="mt-0.5 text-xs text-neutral-500">下の役柄すべてに同じ内容が入ります。</p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="クライアント名" htmlFor="parsed-client">
            <input
              id="parsed-client"
              value={common.clientCompanyName}
              onChange={(e) => updateCommon("clientCompanyName", e.target.value)}
              className={FIELD}
            />
          </Field>
          <Field label="場所" htmlFor="parsed-location">
            <input
              id="parsed-location"
              value={common.location}
              onChange={(e) => updateCommon("location", e.target.value)}
              className={FIELD}
            />
          </Field>
          <Field label="応募締切" htmlFor="parsed-deadline" hint="日付と時刻を選んでください">
            <input
              id="parsed-deadline"
              type="datetime-local"
              value={common.deadline}
              onChange={(e) => updateCommon("deadline", e.target.value)}
              className={FIELD}
            />
          </Field>
          <Field label="案件の説明" htmlFor="parsed-description" className="sm:col-span-2">
            <textarea
              id="parsed-description"
              value={common.description}
              onChange={(e) => updateCommon("description", e.target.value)}
              rows={3}
              className={TEXTAREA}
            />
          </Field>
          <Field label="共通の備考" htmlFor="parsed-common-note" className="sm:col-span-2">
            <textarea
              id="parsed-common-note"
              value={common.commonNote}
              onChange={(e) => updateCommon("commonNote", e.target.value)}
              rows={2}
              className={TEXTAREA}
            />
          </Field>
        </div>

        {(data.common.dates.length > 0 || data.common.requirements.length > 0) && (
          <dl className="grid grid-cols-1 gap-4 rounded-xl bg-neutral-50 p-4 text-sm sm:grid-cols-2">
            {data.common.dates.length > 0 && (
              <div>
                <dt className="text-xs font-medium text-neutral-500">読み取った日程</dt>
                <dd className="mt-1.5 space-y-1">
                  {data.common.dates.map((d, i) => (
                    <p key={i} className="text-neutral-950">
                      <span className="text-neutral-500">{DATE_TYPE_LABELS[d.type] ?? "その他"}</span> {d.date}
                      {d.startTime && ` ${d.startTime}`}
                      {d.location && <span className="text-neutral-500">（{d.location}）</span>}
                    </p>
                  ))}
                </dd>
              </div>
            )}
            {data.common.requirements.length > 0 && (
              <div>
                <dt className="text-xs font-medium text-neutral-500">読み取った提出物</dt>
                <dd className="mt-1.5 flex flex-wrap gap-1.5">
                  {data.common.requirements.map((r) => (
                    <span key={r} className="rounded-full border border-neutral-300 bg-white px-2.5 py-0.5 text-xs text-neutral-800">
                      {REQUIREMENT_LABELS[r] ?? r}
                    </span>
                  ))}
                </dd>
              </div>
            )}
          </dl>
        )}
      </section>

      {/* 役柄 */}
      <section className="space-y-3 border-t border-neutral-200 pt-6">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-neutral-950">役柄（{roles.length}件）</h3>
            <p className="mt-0.5 text-xs text-neutral-500">登録するものにチェックを入れてください。役柄ごとに1つの案件になります。</p>
          </div>
          {roles.length > 1 && (
            <button
              type="button"
              className={`${BTN_GHOST} h-8 shrink-0 px-2 text-xs`}
              onClick={() => setRoles((prev) => prev.map((r) => ({ ...r, checked: !allChecked })))}
            >
              {allChecked ? "すべて外す" : "すべて選ぶ"}
            </button>
          )}
        </div>

        <ul className="space-y-2">
          {roles.map((role, i) => (
            <li
              key={i}
              className={`rounded-xl border transition-colors ${
                role.checked ? "border-neutral-300 bg-white" : "border-neutral-200 bg-neutral-50"
              }`}
            >
              <div className="flex items-start gap-3 p-3 sm:p-4">
                <label className="relative mt-0.5 flex size-5 shrink-0 cursor-pointer items-center justify-center">
                  <input
                    type="checkbox"
                    checked={role.checked}
                    onChange={(e) => updateRole(i, { checked: e.target.checked })}
                    aria-label={`${role.title || "無題の役柄"}を登録する`}
                    className="peer absolute inset-0 cursor-pointer appearance-none rounded-md border border-neutral-400 bg-white checked:border-neutral-950 checked:bg-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950/30"
                  />
                  <Check className="pointer-events-none relative size-3.5 text-white opacity-0 peer-checked:opacity-100" aria-hidden="true" />
                </label>
                <button
                  type="button"
                  onClick={() => updateRole(i, { expanded: !role.expanded })}
                  aria-expanded={role.expanded}
                  className="flex min-w-0 flex-1 items-start justify-between gap-3 text-left focus-visible:outline-none"
                >
                  <span className="min-w-0">
                    <span className={`block truncate text-sm font-medium ${role.checked ? "text-neutral-950" : "text-neutral-400"}`}>
                      {role.title || "（無題）"}
                      {role.mode === "existing" && (
                        <span className="ml-2 rounded bg-blue-600 px-1.5 py-px text-[10px] font-semibold text-white">既存の案件に追加</span>
                      )}
                    </span>
                    <span className="mt-0.5 block">
                      <RoleSummary role={role} />
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1 text-xs text-neutral-500">
                    {role.expanded ? "閉じる" : "編集"}
                    <ChevronDown className={`size-4 transition-transform ${role.expanded ? "rotate-180" : ""}`} aria-hidden="true" />
                  </span>
                </button>
              </div>

              {role.expanded && (
                <div className="grid grid-cols-1 gap-4 border-t border-neutral-100 p-3 sm:grid-cols-2 sm:p-4">
                  <div className="sm:col-span-2">
                    <p className="mb-1.5 text-sm font-medium text-neutral-900">登録のしかた</p>
                    <div className="inline-flex rounded-lg border border-neutral-300 p-0.5" role="radiogroup" aria-label="登録のしかた">
                      {(
                        [
                          ["create", "新しい案件として登録"],
                          ["existing", "既存の案件に追加"],
                        ] as const
                      ).map(([value, label]) => (
                        <button
                          key={value}
                          type="button"
                          role="radio"
                          aria-checked={role.mode === value}
                          onClick={() => updateRole(i, { mode: value })}
                          className={`h-8 rounded-md px-3 text-xs font-medium transition-colors ${
                            role.mode === value ? "bg-neutral-950 text-white" : "text-neutral-600 hover:text-neutral-950"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {role.mode === "existing" && (
                    <Field label="追加先の案件ID" htmlFor={`role-${i}-existing`} hint="案件の詳細ページのURLの最後にある英数字です" className="sm:col-span-2">
                      <input
                        id={`role-${i}-existing`}
                        value={role.existingJobId}
                        onChange={(e) => updateRole(i, { existingJobId: e.target.value })}
                        autoComplete="off"
                        spellCheck={false}
                        className={`${FIELD} font-mono`}
                      />
                    </Field>
                  )}

                  <Field label="案件名" htmlFor={`role-${i}-title`} className="sm:col-span-2">
                    <input
                      id={`role-${i}-title`}
                      value={role.title}
                      onChange={(e) => updateRole(i, { title: e.target.value })}
                      aria-invalid={!role.title.trim() || undefined}
                      className={FIELD}
                    />
                  </Field>
                  <Field label="報酬" htmlFor={`role-${i}-fee`}>
                    <NumberInput id={`role-${i}-fee`} value={role.fee} onChange={(v) => updateRole(i, { fee: v })} unit="円" />
                  </Field>
                  <Field label="募集人数" htmlFor={`role-${i}-capacity`}>
                    <NumberInput id={`role-${i}-capacity`} value={role.capacity} onChange={(v) => updateRole(i, { capacity: v })} unit="名" />
                  </Field>
                  <Field label="性別の条件" htmlFor={`role-${i}-gender`}>
                    <div className="relative">
                      <select
                        id={`role-${i}-gender`}
                        value={role.genderReq}
                        onChange={(e) => updateRole(i, { genderReq: e.target.value || "NONE" })}
                        className={`${FIELD} appearance-none pr-9`}
                      >
                        {GENDER_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-neutral-500" aria-hidden="true" />
                    </div>
                  </Field>
                  <div className="grid grid-cols-2 gap-2">
                    <Field label="年齢（から）" htmlFor={`role-${i}-age-min`}>
                      <NumberInput id={`role-${i}-age-min`} value={role.ageMin} onChange={(v) => updateRole(i, { ageMin: v })} unit="歳" />
                    </Field>
                    <Field label="年齢（まで）" htmlFor={`role-${i}-age-max`}>
                      <NumberInput id={`role-${i}-age-max`} value={role.ageMax} onChange={(v) => updateRole(i, { ageMax: v })} unit="歳" />
                    </Field>
                  </div>
                  <Field label="身長（から）" htmlFor={`role-${i}-height-min`}>
                    <NumberInput id={`role-${i}-height-min`} value={role.heightMin} onChange={(v) => updateRole(i, { heightMin: v })} unit="cm" />
                  </Field>
                  <Field label="身長（まで）" htmlFor={`role-${i}-height-max`}>
                    <NumberInput id={`role-${i}-height-max`} value={role.heightMax} onChange={(v) => updateRole(i, { heightMax: v })} unit="cm" />
                  </Field>
                  <Field label="役柄の備考" htmlFor={`role-${i}-note`} className="sm:col-span-2">
                    <textarea
                      id={`role-${i}-note`}
                      value={role.note}
                      onChange={(e) => updateRole(i, { note: e.target.value })}
                      rows={4}
                      className={TEXTAREA}
                    />
                  </Field>
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>

      {/* 保存ボタンは小窓の下に常に出しておく */}
      <div className="sticky -bottom-6 z-10 -mx-6 -mb-6 flex flex-col-reverse gap-2 border-t border-neutral-200 bg-white px-6 py-3 sm:flex-row sm:items-center sm:justify-end">
        <button type="button" className={`${BTN_SECONDARY} h-10`} onClick={onSuccess}>
          キャンセル
        </button>
        <button type="button" className={`${BTN_PRIMARY} h-10 sm:px-6`} onClick={handleSubmit} disabled={saving || checkedCount === 0}>
          {saving ? (
            <>
              <Loader2 className="animate-spin" aria-hidden="true" />
              登録中…
            </>
          ) : checkedCount === 0 ? (
            "登録する役柄を選んでください"
          ) : (
            `選んだ${checkedCount}件を案件として登録`
          )}
        </button>
      </div>
    </div>
  )
}
