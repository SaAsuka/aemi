"use client"

import { useState } from "react"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { calcAge } from "@/lib/utils/date"
import { GENDER_LABELS } from "@/types"

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

  const copyText = async () => {
    const lines = [`名前：${talent.name}`]
    if (talent.birthDate) lines.push(`年齢：${calcAge(talent.birthDate)}`)
    if (talent.height) lines.push(`身長：${talent.height}`)
    if (talent.gender) lines.push(`性別：${GENDER_LABELS[talent.gender] ?? talent.gender}`)
    if (talent.nearestStation) lines.push(`最寄駅：${talent.nearestStation}`)
    await navigator.clipboard.writeText(lines.join("\n"))
    setCopiedText(true)
    setTimeout(() => setCopiedText(false), 2000)
  }

  const copyPdf = async () => {
    if (!talent.resume) return
    await navigator.clipboard.writeText(talent.resume)
    setCopiedPdf(true)
    setTimeout(() => setCopiedPdf(false), 2000)
  }

  return (
    <span className="inline-flex gap-1">
      <Button variant="outline" size="xs" onClick={copyText}>
        {copiedText ? <><Check className="h-3 w-3 text-green-600" /> コピー済</> : "情報コピー"}
      </Button>
      {talent.resume && (
        <Button variant="outline" size="xs" onClick={copyPdf}>
          {copiedPdf ? <><Check className="h-3 w-3 text-green-600" /> コピー済</> : "PDFコピー"}
        </Button>
      )}
    </span>
  )
}
