"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { MoreVertical, Copy, Download, Trash2, Check, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { deleteApplication } from "@/lib/actions/application"
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

export function ApplicationRowActions({
  applicationId,
  talent,
}: {
  applicationId: string
  talent: TalentInfo
}) {
  const [copiedText, setCopiedText] = useState(false)
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const copyText = async (e: React.MouseEvent) => {
    e.preventDefault()
    const lines = [`名前：${talent.name}`]
    if (talent.birthDate) lines.push(`年齢：${calcAge(talent.birthDate)}`)
    if (talent.height) lines.push(`身長：${talent.height}`)
    if (talent.gender) lines.push(`性別：${GENDER_LABELS[talent.gender] ?? talent.gender}`)
    if (talent.nearestStation) lines.push(`最寄駅：${talent.nearestStation}`)
    await navigator.clipboard.writeText(lines.join("\n"))
    setCopiedText(true)
    setTimeout(() => setCopiedText(false), 2000)
  }

  const downloadPdf = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!talent.resume || downloadingPdf) return
    setDownloadingPdf(true)
    try {
      const filename = encodeURIComponent(`${talent.name}_コンポジ.pdf`)
      if (talent.resume.includes(".supabase.co/storage/")) {
        const res = await fetch(`/api/blob?url=${encodeURIComponent(talent.resume)}&sign=true&download=true&filename=${filename}`)
        if (!res.ok) {
          const json = await res.json().catch(() => ({}))
          if (res.status === 404 || json.error === "not_found") {
            alert("PDFファイルが見つかりません。\nファイルが削除されているか、まだ登録されていない可能性があります。")
          } else {
            alert("サーバーエラーが発生しました。\nしばらく待ってから再試行してください。")
          }
          return
        }
        const { url } = await res.json()
        window.open(url, "_blank")
      } else {
        const res = await fetch(`/api/blob?url=${encodeURIComponent(talent.resume)}&download=true&filename=${filename}`)
        if (!res.ok) {
          const json = await res.json().catch(() => ({}))
          if (res.status === 404 || json.error === "not_found") {
            alert("PDFファイルが見つかりません。\nファイルが削除されているか、まだ登録されていない可能性があります。")
          } else {
            alert("サーバーエラーが発生しました。\nしばらく待ってから再試行してください。")
          }
          return
        }
        const blob = await res.blob()
        const objectUrl = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = objectUrl
        a.download = `${talent.name}_コンポジ.pdf`
        a.click()
        URL.revokeObjectURL(objectUrl)
      }
    } catch {
      alert("通信エラーが発生しました。\nネットワーク接続を確認して再試行してください。")
    } finally {
      setDownloadingPdf(false)
    }
  }

  function handleDelete(e: React.MouseEvent) {
    e.preventDefault()
    if (!confirm("この応募を削除しますか？")) return
    startTransition(async () => {
      await deleteApplication(applicationId)
      router.refresh()
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="xs" className="h-7 w-7 p-0">
            <MoreVertical className="h-3.5 w-3.5" />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-auto min-w-[140px]">
        <DropdownMenuItem onClick={copyText}>
          {copiedText ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
          {copiedText ? "コピー済" : "情報コピー"}
        </DropdownMenuItem>
        {talent.resume && (
          <DropdownMenuItem onClick={downloadPdf} disabled={downloadingPdf}>
            {downloadingPdf ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
            {downloadingPdf ? "取得中..." : "PDFダウンロード"}
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={handleDelete} disabled={isPending}>
          <Trash2 className="h-3.5 w-3.5" />
          {isPending ? "削除中..." : "削除"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
