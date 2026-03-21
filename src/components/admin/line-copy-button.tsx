"use client"

import { useState } from "react"
import { Copy, Check, FileText } from "lucide-react"
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
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={copyText} title="LINE用テキストをコピー">
        {copiedText ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
      </Button>
      {talent.resume && (
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={copyPdf} title="PDF URLをコピー">
          {copiedPdf ? <Check className="h-3.5 w-3.5 text-green-600" /> : <FileText className="h-3.5 w-3.5" />}
        </Button>
      )}
    </span>
  )
}
