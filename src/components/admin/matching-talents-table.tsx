"use client"

import { useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { Check, Loader2, Send } from "lucide-react"
import { sendLineNotification } from "@/lib/actions/job"
import { GENDER_LABELS } from "@/types"
import { StatusChip } from "@/components/admin/status-chip"
import { BTN_GHOST, BTN_PRIMARY } from "@/components/admin/styles"

type MatchingTalent = {
  id: string
  name: string
  gender: string | null
  age: number | null
  height: number | null
  matchStatus: "match" | "partial"
  hasLine: boolean
}

function Checkbox({ checked, disabled, onChange, label }: { checked: boolean; disabled?: boolean; onChange: () => void; label: string }) {
  return (
    <span className="relative flex size-5 shrink-0 items-center justify-center">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        aria-label={label}
        className="peer absolute inset-0 cursor-pointer appearance-none rounded-[5px] border border-neutral-400 bg-white checked:border-neutral-950 checked:bg-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950/30 disabled:cursor-not-allowed disabled:border-neutral-200 disabled:bg-neutral-100"
      />
      <Check className="pointer-events-none relative size-3.5 text-white opacity-0 peer-checked:opacity-100" aria-hidden="true" />
    </span>
  )
}

export function MatchingTalentsTable({
  jobId,
  talents,
}: {
  jobId: string
  talents: MatchingTalent[]
}) {
  const [selected, setSelected] = useState<Set<string>>(() => {
    return new Set(talents.filter((t) => t.hasLine).map((t) => t.id))
  })
  const [sending, setSending] = useState(false)

  // お知らせを送れる人（LINE連携済み）→ 条件に一致 の順で上に並べる
  const sorted = [...talents].sort(
    (a, b) => Number(b.hasLine) - Number(a.hasLine) || Number(b.matchStatus === "match") - Number(a.matchStatus === "match")
  )
  const lineIds = talents.filter((t) => t.hasLine).map((t) => t.id)
  const lineCount = lineIds.length
  const selectedCount = selected.size
  const allSelected = lineCount > 0 && lineIds.every((id) => selected.has(id))

  const toggleAll = () => {
    setSelected(allSelected ? new Set() : new Set(lineIds))
  }

  const toggle = (id: string) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
  }

  const handleSend = async () => {
    const ids = [...selected]
    if (ids.length === 0) return
    if (!confirm(`選んだ${ids.length}名に、この案件のお知らせをLINEで送ります。よろしいですか？`)) return
    setSending(true)
    const res = await sendLineNotification(jobId, ids)
    setSending(false)
    if (res.success) {
      toast.success("LINEでお知らせを送りました", { description: `${res.totalSelected}名のうち${res.sentCount}名に送信しました` })
    } else {
      toast.error("送信できませんでした", { description: res.error ?? undefined })
    }
  }

  if (talents.length === 0) {
    return (
      <p className="rounded-lg bg-neutral-50 px-4 py-6 text-center text-sm text-neutral-500">
        条件に合う、まだ応募していないタレントはいません。
      </p>
    )
  }

  const matchChip = (t: MatchingTalent) =>
    t.matchStatus === "match" ? (
      <StatusChip tone="green" label="条件に一致" />
    ) : (
      <span title="性別・年齢・身長のどれかが未登録のため、合うかどうか確かめられません">
        <StatusChip tone="yellow" label="一部が未登録" />
      </span>
    )
  const lineChip = (t: MatchingTalent) =>
    t.hasLine ? <StatusChip tone="green" label="LINE連携済" /> : <StatusChip tone="gray" label="LINE未連携" />
  const profile = (t: MatchingTalent) =>
    [t.gender ? GENDER_LABELS[t.gender] : null, t.age != null ? `${t.age}歳` : null, t.height ? `${t.height}cm` : null]
      .filter(Boolean)
      .join(" ・ ") || "プロフィール未登録"

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-xl bg-neutral-50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-neutral-700">
          {lineCount === 0 ? (
            "LINE連携済みのタレントがいないため、お知らせは送れません。"
          ) : (
            <>
              LINE連携済み {lineCount}名のうち <span className="font-semibold text-neutral-950">{selectedCount}名</span> を選択中
            </>
          )}
        </p>
        {lineCount > 0 && (
          <div className="flex gap-2">
            <button type="button" className={`${BTN_GHOST} flex-1 sm:flex-none`} onClick={toggleAll}>
              {allSelected ? "すべて外す" : "すべて選ぶ"}
            </button>
            <button type="button" className={`${BTN_PRIMARY} flex-[2] sm:flex-none`} onClick={handleSend} disabled={sending || selectedCount === 0}>
              {sending ? (
                <>
                  <Loader2 className="animate-spin" aria-hidden="true" />
                  送信中…
                </>
              ) : (
                <>
                  <Send aria-hidden="true" />
                  {selectedCount > 0 ? `${selectedCount}名にLINEでお知らせ` : "送る人を選んでください"}
                </>
              )}
            </button>
          </div>
        )}
      </div>

      <ul className="divide-y divide-neutral-100 rounded-xl border border-neutral-200">
        {sorted.map((t) => (
          <li key={t.id}>
            <label className={`flex items-center gap-3 px-4 py-3 ${t.hasLine ? "cursor-pointer hover:bg-neutral-50" : ""}`}>
              <Checkbox
                checked={selected.has(t.id)}
                disabled={!t.hasLine}
                onChange={() => toggle(t.id)}
                label={t.hasLine ? `${t.name}さんに送る` : `${t.name}さんはLINE未連携のため送れません`}
              />
              <span className="min-w-0 flex-1">
                <Link
                  href={`/admin/talents/${t.id}`}
                  className="text-sm font-medium text-neutral-950 underline-offset-4 hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {t.name}
                </Link>
                <span className="mt-0.5 block text-xs text-neutral-500">{profile(t)}</span>
              </span>
              <span className="flex shrink-0 flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-1.5">
                {matchChip(t)}
                {lineChip(t)}
              </span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  )
}
