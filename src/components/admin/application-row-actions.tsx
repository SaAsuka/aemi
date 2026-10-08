"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useConfirm } from "@/components/admin/confirm-dialog"
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
import { useCopyWithFallback } from "@/components/admin/copy-fallback"

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
  const { copy, fallback } = useCopyWithFallback()
  const [confirm, confirmDialog] = useConfirm()

  const copyText = async (e: React.MouseEvent) => {
    e.preventDefault()
    const lines = [`名前：${talent.name}`]
    if (talent.birthDate) lines.push(`年齢：${calcAge(talent.birthDate)}`)
    if (talent.height) lines.push(`身長：${talent.height}`)
    if (talent.gender) lines.push(`性別：${GENDER_LABELS[talent.gender] ?? talent.gender}`)
    if (talent.nearestStation) lines.push(`最寄駅：${talent.nearestStation}`)
    if (!(await copy(lines.join("\n"), e.currentTarget as HTMLElement))) return
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
            toast.error("PDFファイルが見つかりません", { description: "ファイルが削除されたか、まだ登録されていない可能性があります。" })
          } else {
            toast.error("PDFを取得できませんでした", { description: "少し時間をおいて、もう一度お試しください。" })
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
            toast.error("PDFファイルが見つかりません", { description: "ファイルが削除されたか、まだ登録されていない可能性があります。" })
          } else {
            toast.error("PDFを取得できませんでした", { description: "少し時間をおいて、もう一度お試しください。" })
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
      toast.error("通信できませんでした", { description: "インターネットの接続を確認して、もう一度お試しください。" })
    } finally {
      setDownloadingPdf(false)
    }
  }

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault()
    const ok = await confirm({
      title: `${talent.name}さんのこの応募を削除しますか？`,
      description: "提出された写真・動画と、登録済みの予定も一緒に消え、元に戻せません。",
      confirmLabel: "削除する",
      danger: true,
    })
    if (!ok) return
    startTransition(async () => {
      let res: Awaited<ReturnType<typeof deleteApplication>>
      try {
        res = await deleteApplication(applicationId)
      } catch {
        toast.error("削除できませんでした", { description: "少し時間をおいて、もう一度お試しください。" })
        return
      }
      if ("error" in res && res.error) {
        toast.error("削除できませんでした", { description: res.error })
        return
      }
      toast.success("応募を削除しました")
      router.refresh()
    })
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="xs"
              aria-label="その他の操作（情報コピー・PDF・削除）"
              className="h-8 w-8 p-0 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-950"
            >
              <MoreVertical className="h-4 w-4" />
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
      {fallback}
      {confirmDialog}
    </>
  )
}
