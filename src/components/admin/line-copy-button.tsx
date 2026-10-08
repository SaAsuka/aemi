"use client"

import { useState } from "react"
import { Check } from "lucide-react"
import { calcAge } from "@/lib/utils/date"
import { GENDER_LABELS } from "@/types"
import { useCopyWithFallback } from "@/components/admin/copy-fallback"

type TalentInfo = {
  name: string
  birthDate: Date | null
  height: number | null
  gender: string | null
  nearestStation: string | null
  resume: string | null
}

export function LineCopyButton({ talent }: { talent: TalentInfo }) {
  const [copiedText, setCopiedText] = useState(false)
  const [copiedPdf, setCopiedPdf] = useState(false)
  const { copy, fallback } = useCopyWithFallback()

  const copyText = async (e: React.MouseEvent<HTMLElement>) => {
    const lines = [`名前：${talent.name}`]
    if (talent.birthDate) lines.push(`年齢：${calcAge(talent.birthDate)}`)
    if (talent.height) lines.push(`身長：${talent.height}`)
    if (talent.gender) lines.push(`性別：${GENDER_LABELS[talent.gender] ?? talent.gender}`)
    if (talent.nearestStation) lines.push(`最寄駅：${talent.nearestStation}`)
    if (!(await copy(lines.join("\n"), e.currentTarget.parentElement))) return
    setCopiedText(true)
    setTimeout(() => setCopiedText(false), 2000)
  }

  const copyPdf = async (e: React.MouseEvent<HTMLElement>) => {
    if (!talent.resume) return
    if (!(await copy(talent.resume, e.currentTarget.parentElement))) return
    setCopiedPdf(true)
    setTimeout(() => setCopiedPdf(false), 2000)
  }

  const btn =
    "inline-flex h-7 items-center gap-1 rounded-md border border-neutral-300 bg-white px-2 text-xs font-medium text-neutral-800 transition-colors hover:border-neutral-400 hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950/30"

  return (
    <span className="inline-flex gap-1">
      <button type="button" className={btn} onClick={copyText} title="名前・年齢・身長などをLINEに貼り付けられる形でコピーします">
        {copiedText ? <><Check className="size-3.5 text-green-600" aria-hidden="true" />コピー済</> : "情報コピー"}
      </button>
      {talent.resume && (
        <button type="button" className={btn} onClick={copyPdf} title="コンポジPDFのURLをコピーします">
          {copiedPdf ? <><Check className="size-3.5 text-green-600" aria-hidden="true" />コピー済</> : "PDFコピー"}
        </button>
      )}
      {fallback}
    </span>
  )
}
