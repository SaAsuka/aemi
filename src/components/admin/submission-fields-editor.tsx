"use client"

// 管理画面の案件編集：案件ごとの自由な提出項目（今の4種類とは別）を足す・直す・消す・並べ替える。
// 中身は JSON にして hidden の submissionFields で送る。受け付け側（createJob / updateJob）で形を確かめる。
import { useState } from "react"
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react"
import {
  detectAutofill,
  makeVozelFieldKey,
  type Autofill,
  type FieldKind,
  type SubmissionField,
} from "@/lib/submission-fields"
import { BTN_GHOST, BTN_SECONDARY, FIELD } from "@/components/admin/styles"

const KIND_OPTIONS: { value: FieldKind; label: string }[] = [
  { value: "PHOTO", label: "写真" },
  { value: "FILE", label: "ファイル" },
  { value: "TEXT", label: "文字" },
  { value: "URL", label: "リンク" },
]

const AUTOFILL_LABELS: Record<Autofill | "NONE", string> = {
  NONE: "なし",
  NAME: "名前（プロフィールから入れる）",
  AGE: "年齢（プロフィールから入れる）",
  HEIGHT: "身長（プロフィールから入れる）",
  COMPOSITE: "コンポジ（フォームに出さず、登録済みのコンポジットを表示）",
}

function autofillOptions(kind: FieldKind): (Autofill | "NONE")[] {
  return kind === "TEXT" ? ["NONE", "NAME", "AGE", "HEIGHT", "COMPOSITE"] : ["NONE", "COMPOSITE"]
}

function newField(): SubmissionField {
  return {
    key: makeVozelFieldKey(),
    label: "",
    kind: "TEXT",
    required: true,
    note: null,
    autofill: null,
    autofillOverridden: false,
    source: "VOZEL",
  }
}

export function SubmissionFieldsEditor({
  initial,
  hadSavedFields,
  error,
  onEdit,
}: {
  initial: SubmissionField[]
  // 保存済みの値が（空配列も含めて）あったか。無かった案件で何も足さなければ値を送らない（null のまま残す）
  hadSavedFields: boolean
  error?: string
  onEdit?: () => void
}) {
  const [fields, setFields] = useState<SubmissionField[]>(initial)

  const update = (index: number, patch: Partial<SubmissionField>) => {
    setFields((prev) =>
      prev.map((f, i) => {
        if (i !== index) return f
        const next = { ...f, ...patch }
        // 管理者が判定を直していなければ、項目名・種類に合わせて自動判定し直す
        if (!next.autofillOverridden && ("label" in patch || "kind" in patch)) {
          next.autofill = detectAutofill(next.label, next.kind)
        }
        if (next.autofill && next.autofill !== "COMPOSITE" && next.kind !== "TEXT") next.autofill = null
        return next
      })
    )
    onEdit?.()
  }

  const move = (index: number, dir: -1 | 1) => {
    setFields((prev) => {
      const target = index + dir
      if (target < 0 || target >= prev.length) return prev
      const next = [...prev]
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
    onEdit?.()
  }

  const remove = (index: number) => {
    setFields((prev) => prev.filter((_, i) => i !== index))
    onEdit?.()
  }

  const add = () => {
    setFields((prev) => [...prev, newField()])
    onEdit?.()
  }

  const shouldSend = hadSavedFields || fields.length > 0

  return (
    <div data-field="submissionFields" className="space-y-3">
      {shouldSend && <input type="hidden" name="submissionFields" value={JSON.stringify(fields)} />}

      {error && (
        <p id="submissionFields-error" className="text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      {fields.length === 0 && (
        <p className="rounded-lg bg-neutral-50 px-4 py-4 text-sm text-neutral-500">
          案件ごとの提出項目はありません。「最寄駅」「手の甲の写真」など、上の4種類以外に出してほしいものがあれば追加してください。
        </p>
      )}

      <ol className="space-y-3">
        {fields.map((f, i) => (
          <li key={f.key} className="rounded-xl border border-neutral-200 p-3 sm:p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-neutral-500">
                項目 {i + 1}
                {f.source === "KAMITE" && <span className="ml-2 rounded bg-neutral-100 px-1.5 py-0.5">KAMITEから</span>}
              </p>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="上へ" className={BTN_GHOST}>
                  <ArrowUp aria-hidden="true" />
                </button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === fields.length - 1} aria-label="下へ" className={BTN_GHOST}>
                  <ArrowDown aria-hidden="true" />
                </button>
                <button type="button" onClick={() => remove(i)} aria-label="この項目を消す" className={`${BTN_GHOST} text-red-600 hover:text-red-700`}>
                  <Trash2 aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_140px]">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-neutral-900">項目名</span>
                <input
                  value={f.label}
                  onChange={(e) => update(i, { label: e.target.value })}
                  maxLength={200}
                  placeholder="例: 最寄駅"
                  aria-invalid={!f.label.trim() || undefined}
                  className={FIELD}
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-neutral-900">種類</span>
                <select value={f.kind} onChange={(e) => update(i, { kind: e.target.value as FieldKind })} className={FIELD}>
                  {KIND_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block sm:col-span-2">
                <span className="mb-1.5 block text-sm font-medium text-neutral-900">指示（撮り方など）</span>
                <textarea
                  value={f.note ?? ""}
                  onChange={(e) => update(i, { note: e.target.value || null })}
                  maxLength={1000}
                  rows={2}
                  className={`${FIELD} h-auto py-2 leading-relaxed`}
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="mb-1.5 block text-sm font-medium text-neutral-900">自動で入れるもの</span>
                <select
                  value={f.autofill ?? "NONE"}
                  onChange={(e) => {
                    const v = e.target.value as Autofill | "NONE"
                    update(i, { autofill: v === "NONE" ? null : v, autofillOverridden: true })
                  }}
                  className={FIELD}
                >
                  {autofillOptions(f.kind).map((o) => (
                    <option key={o} value={o}>
                      {AUTOFILL_LABELS[o]}
                    </option>
                  ))}
                </select>
                <span className="mt-1 block text-xs text-neutral-500">
                  {f.autofillOverridden ? "手で設定しました（KAMITEから送り直されてもこの設定のまま）" : "項目名から自動で判定しています"}
                </span>
              </label>
              <label className="flex items-center gap-2 text-sm text-neutral-900">
                <input type="checkbox" checked={f.required} onChange={(e) => update(i, { required: e.target.checked })} className="size-4" />
                必須にする
              </label>
            </div>
          </li>
        ))}
      </ol>

      <button type="button" onClick={add} className={BTN_SECONDARY}>
        <Plus aria-hidden="true" />
        項目を追加
      </button>
    </div>
  )
}
