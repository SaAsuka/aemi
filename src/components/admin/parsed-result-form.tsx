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
import { Textarea } from "@/components/ui/textarea"
import { applyParsedJob } from "@/lib/actions/apply-parsed-job"
import type { ParseResult, ParsedTalentEntry } from "@/lib/validations/parsed-job"

const STATUS_LABELS: Record<string, string> = {
  ACCEPTED: "合格",
  REJECTED: "不合格",
  PENDING: "選考中",
}

const GENDER_OPTIONS = [
  { value: "NONE", label: "指定なし" },
  { value: "MALE", label: "男性" },
  { value: "FEMALE", label: "女性" },
  { value: "OTHER", label: "その他" },
] as const

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

export function ParsedResultForm({
  data,
  onSuccess,
}: {
  data: ParseResult
  onSuccess: () => void
}) {
  const router = useRouter()
  const [mode, setMode] = useState<"create" | "existing">(
    data.existingJobId ? "existing" : "create"
  )
  const [existingJobId, setExistingJobId] = useState(data.existingJobId ?? "")
  const [title, setTitle] = useState(data.job.title)
  const [description, setDescription] = useState(data.job.description ?? "")
  const [location, setLocation] = useState(data.job.location ?? "")
  const [fee, setFee] = useState(data.job.fee?.toString() ?? "")
  const [genderReq, setGenderReq] = useState<string>(data.job.genderReq ?? "NONE")
  const [ageMin, setAgeMin] = useState(data.job.ageMin?.toString() ?? "")
  const [ageMax, setAgeMax] = useState(data.job.ageMax?.toString() ?? "")
  const [heightMin, setHeightMin] = useState(data.job.heightMin?.toString() ?? "")
  const [heightMax, setHeightMax] = useState(data.job.heightMax?.toString() ?? "")
  const [startsAt, setStartsAt] = useState(toDatetimeLocal(data.job.startsAt))
  const [endsAt, setEndsAt] = useState(toDatetimeLocal(data.job.endsAt))
  const [deadline, setDeadline] = useState(toDatetimeLocal(data.job.deadline))
  const [capacity, setCapacity] = useState(data.job.capacity?.toString() ?? "")
  const [note, setNote] = useState(() => {
    const jobNote = data.job.note ?? ""
    const talentNote = buildTalentNote(data.job.talents)
    return [jobNote, talentNote].filter(Boolean).join("\n\n")
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error("案件名を入力してください")
      return
    }

    setSaving(true)
    const result = await applyParsedJob({
      mode,
      existingJobId: mode === "existing" ? existingJobId : undefined,
      title,
      description: description || undefined,
      location: location || undefined,
      fee: fee ? parseInt(fee, 10) : undefined,
      genderReq: genderReq !== "NONE" ? genderReq as "MALE" | "FEMALE" | "OTHER" : undefined,
      ageMin: ageMin ? parseInt(ageMin, 10) : undefined,
      ageMax: ageMax ? parseInt(ageMax, 10) : undefined,
      heightMin: heightMin ? parseInt(heightMin, 10) : undefined,
      heightMax: heightMax ? parseInt(heightMax, 10) : undefined,
      startsAt: startsAt || undefined,
      endsAt: endsAt || undefined,
      deadline: deadline || undefined,
      capacity: capacity ? parseInt(capacity, 10) : undefined,
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
          <Label>案件説明</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>

        <div className="space-y-1">
          <Label>場所</Label>
          <Input value={location} onChange={(e) => setLocation(e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>報酬（円）</Label>
            <Input type="number" value={fee} onChange={(e) => setFee(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>募集人数</Label>
            <Input type="number" value={capacity} onChange={(e) => setCapacity(e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <Label>性別条件</Label>
            <Select value={genderReq} onValueChange={(v) => setGenderReq(v ?? "NONE")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GENDER_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>年齢（下限）</Label>
            <Input type="number" value={ageMin} onChange={(e) => setAgeMin(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>年齢（上限）</Label>
            <Input type="number" value={ageMax} onChange={(e) => setAgeMax(e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>身長（下限cm）</Label>
            <Input type="number" value={heightMin} onChange={(e) => setHeightMin(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>身長（上限cm）</Label>
            <Input type="number" value={heightMax} onChange={(e) => setHeightMax(e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <Label>開始日時</Label>
            <Input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>終了日時</Label>
            <Input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>応募締切</Label>
            <Input type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </div>
        </div>

        {data.job.dates && (
          <div className="text-sm text-muted-foreground">
            日程情報（原文）: {data.job.dates}
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
