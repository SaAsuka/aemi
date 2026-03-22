"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { Textarea } from "@/components/ui/textarea"
import { applyParsedJob } from "@/lib/actions/apply-parsed-job"
import type { ParseResult, ParsedTalentEntry } from "@/lib/validations/parsed-job"

type ClientOption = { id: string; companyName: string }

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

export function ParsedResultForm({
  data,
  clientOptions,
  onSuccess,
}: {
  data: ParseResult
  clientOptions: ClientOption[]
  onSuccess: () => void
}) {
  const router = useRouter()
  const [mode, setMode] = useState<"create" | "existing">(
    data.existingJobId ? "existing" : "create"
  )
  const [existingJobId, setExistingJobId] = useState(data.existingJobId ?? "")
  const [title, setTitle] = useState(data.job.title)
  const [clientId, setClientId] = useState(data.existingClientId ?? "")
  const [location, setLocation] = useState(data.job.location ?? "")
  const [note, setNote] = useState(() => {
    const jobNote = data.job.note ?? ""
    const talentNote = buildTalentNote(data.job.talents)
    return [jobNote, talentNote].filter(Boolean).join("\n\n")
  })
  const [saving, setSaving] = useState(false)

  const clientComboOptions = clientOptions.map((c) => ({
    value: c.id,
    label: c.companyName,
  }))

  const handleSubmit = async () => {
    if (!clientId) {
      toast.error("クライアントを選択してください")
      return
    }
    if (!title.trim()) {
      toast.error("案件名を入力してください")
      return
    }

    setSaving(true)
    const result = await applyParsedJob({
      mode,
      existingJobId: mode === "existing" ? existingJobId : undefined,
      title,
      clientId,
      location: location || undefined,
      note: note || undefined,
    })
    setSaving(false)

    if (result.success) {
      toast.success("保存しました")
      router.refresh()
      onSuccess()
    } else {
      toast.error(result.error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="font-semibold">案件情報</h3>

        <div className="flex gap-4 items-center">
          <Label>モード</Label>
          <Select value={mode} onValueChange={(v) => setMode(v as "create" | "existing")}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="create">新規作成</SelectItem>
              <SelectItem value="existing">既存案件に紐付け</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {mode === "existing" && (
          <div className="space-y-1">
            <Label>既存案件ID</Label>
            <Input value={existingJobId} onChange={(e) => setExistingJobId(e.target.value)} />
          </div>
        )}

        <div className="space-y-1">
          <Label>案件名</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>

        <div className="space-y-1">
          <Label>クライアント</Label>
          <SearchableSelect
            options={clientComboOptions}
            value={clientId || null}
            onValueChange={(v) => setClientId(v ?? "")}
            placeholder="クライアントを選択..."
          />
        </div>

        <div className="space-y-1">
          <Label>場所</Label>
          <Input value={location} onChange={(e) => setLocation(e.target.value)} />
        </div>

        {data.job.dates && (
          <div className="text-sm text-muted-foreground">
            日程情報: {data.job.dates}
          </div>
        )}

        <div className="space-y-1">
          <Label>備考（タレント情報含む）</Label>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={6}
          />
        </div>
      </div>

      {data.job.talents.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold">タレント一覧（{data.job.talents.length}名）</h3>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>名前</TableHead>
                  <TableHead>ステータス</TableHead>
                  <TableHead>日付</TableHead>
                  <TableHead>時間</TableHead>
                  <TableHead>場所</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.job.talents.map((talent, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{talent.name}</TableCell>
                    <TableCell>{STATUS_LABELS[talent.status] ?? talent.status}</TableCell>
                    <TableCell>{talent.date ?? "−"}</TableCell>
                    <TableCell>{talent.startTime ?? "−"}</TableCell>
                    <TableCell>{talent.location ?? "−"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onSuccess}>
          キャンセル
        </Button>
        <Button onClick={handleSubmit} disabled={saving}>
          {saving ? "保存中..." : "保存"}
        </Button>
      </div>
    </div>
  )
}
