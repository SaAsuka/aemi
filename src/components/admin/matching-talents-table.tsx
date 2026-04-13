"use client"

import { useState } from "react"
import Link from "next/link"
import { Send } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { sendLineNotification } from "@/lib/actions/job"
import { GENDER_LABELS } from "@/types"

type MatchingTalent = {
  id: string
  name: string
  gender: string | null
  age: number | null
  height: number | null
  matchStatus: "match" | "partial"
  hasLine: boolean
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
  const [result, setResult] = useState<string | null>(null)

  const lineCount = talents.filter((t) => t.hasLine).length
  const selectedCount = selected.size

  const toggleAll = () => {
    const lineIds = talents.filter((t) => t.hasLine).map((t) => t.id)
    if (lineIds.every((id) => selected.has(id))) {
      setSelected(new Set())
    } else {
      setSelected(new Set(lineIds))
    }
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
    if (!confirm(`${ids.length}名にLINE通知を送信しますか？`)) return
    setSending(true)
    setResult(null)
    const res = await sendLineNotification(jobId, ids)
    setSending(false)
    if (res.success) {
      setResult(`${res.sentCount}/${res.totalSelected}名に送信しました`)
    } else {
      setResult(res.error ?? "送信に失敗しました")
    }
  }

  return (
    <>
      <div className="flex items-center gap-3 mb-4">
        <Button onClick={handleSend} disabled={sending || selectedCount === 0} size="sm">
          <Send className="h-4 w-4 mr-1" />
          {sending ? "送信中..." : `LINE通知送信（${selectedCount}名）`}
        </Button>
        {result && <span className="text-sm text-muted-foreground">{result}</span>}
        {lineCount === 0 && (
          <span className="text-sm text-muted-foreground">LINE連携済みのタレントがいません</span>
        )}
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <input
                type="checkbox"
                checked={lineCount > 0 && talents.filter((t) => t.hasLine).every((t) => selected.has(t.id))}
                onChange={toggleAll}
                disabled={lineCount === 0}
                className="h-4 w-4"
              />
            </TableHead>
            <TableHead>タレント名</TableHead>
            <TableHead>性別</TableHead>
            <TableHead>年齢</TableHead>
            <TableHead>身長</TableHead>
            <TableHead>マッチ</TableHead>
            <TableHead>LINE</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {talents.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground">
                該当するタレントがいません
              </TableCell>
            </TableRow>
          ) : (
            talents.map((t) => (
              <TableRow key={t.id}>
                <TableCell>
                  <input
                    type="checkbox"
                    checked={selected.has(t.id)}
                    onChange={() => toggle(t.id)}
                    disabled={!t.hasLine}
                    className="h-4 w-4"
                  />
                </TableCell>
                <TableCell>
                  <Link href={`/admin/talents/${t.id}`} className="hover:underline">
                    {t.name}
                  </Link>
                </TableCell>
                <TableCell>{t.gender ? GENDER_LABELS[t.gender] : "-"}</TableCell>
                <TableCell>{t.age != null ? `${t.age}歳` : "-"}</TableCell>
                <TableCell>{t.height ? `${t.height}cm` : "-"}</TableCell>
                <TableCell>
                  <Badge variant={t.matchStatus === "match" ? "default" : "secondary"}>
                    {t.matchStatus === "match" ? "一致" : "一部不明"}
                  </Badge>
                </TableCell>
                <TableCell>
                  {t.hasLine ? (
                    <Badge variant="outline" className="text-green-600 border-green-600">連携済</Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">未連携</span>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </>
  )
}
