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
import { applyParsedJob } from "@/lib/actions/apply-parsed-job"
import type { ParseResult, MatchedTalent } from "@/lib/validations/parsed-job"

type ClientOption = { id: string; companyName: string }
type TalentOption = { id: string; name: string; nameKana: string }

const STATUS_OPTIONS = [
  { value: "ACCEPTED", label: "合格" },
  { value: "REJECTED", label: "不合格" },
  { value: "PENDING", label: "選考中" },
]

export function ParsedResultForm({
  data,
  clientOptions,
  talentOptions,
  onSuccess,
}: {
  data: ParseResult
  clientOptions: ClientOption[]
  talentOptions: TalentOption[]
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
  const [talents, setTalents] = useState<MatchedTalent[]>(data.matchedTalents)
  const [saving, setSaving] = useState(false)

  const talentComboOptions = talentOptions.map((t) => ({
    value: t.id,
    label: `${t.name}（${t.nameKana}）`,
  }))

  const clientComboOptions = clientOptions.map((c) => ({
    value: c.id,
    label: c.companyName,
  }))

  const updateTalent = (index: number, patch: Partial<MatchedTalent>) => {
    setTalents((prev) => prev.map((t, i) => (i === index ? { ...t, ...patch } : t)))
  }

  const handleSubmit = async () => {
    if (!clientId) {
      toast.error("クライアントを選択してください")
      return
    }
    if (!title.trim()) {
      toast.error("案件名を入力してください")
      return
    }

    const validTalents = talents.filter((t) => t.matchedTalentId)
    if (validTalents.length === 0) {
      toast.error("タレントが1人もマッチングされていません")
      return
    }

    setSaving(true)
    const result = await applyParsedJob({
      mode,
      existingJobId: mode === "existing" ? existingJobId : undefined,
      title,
      clientId,
      location: location || undefined,
      talents: validTalents.map((t) => ({
        talentId: t.matchedTalentId!,
        status: t.status,
        date: t.date ?? undefined,
        startTime: t.startTime ?? undefined,
        location: t.location ?? undefined,
        note: t.note ?? undefined,
      })),
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
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold">タレント一覧（{talents.length}名）</h3>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[100px]">パース名</TableHead>
                <TableHead className="min-w-[200px]">マッチング</TableHead>
                <TableHead className="min-w-[100px]">ステータス</TableHead>
                <TableHead className="min-w-[120px]">日付</TableHead>
                <TableHead className="min-w-[80px]">時間</TableHead>
                <TableHead>場所</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {talents.map((talent, i) => (
                <TableRow key={i} className={!talent.matchedTalentId ? "bg-yellow-50 dark:bg-yellow-950/20" : ""}>
                  <TableCell className="text-sm">{talent.name}</TableCell>
                  <TableCell>
                    <SearchableSelect
                      options={talentComboOptions}
                      value={talent.matchedTalentId}
                      onValueChange={(v) => updateTalent(i, { matchedTalentId: v })}
                      placeholder="タレント選択..."
                    />
                  </TableCell>
                  <TableCell>
                    <Select
                      value={talent.status}
                      onValueChange={(v) =>
                        updateTalent(i, { status: v as "ACCEPTED" | "REJECTED" | "PENDING" })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="date"
                      value={talent.date ?? ""}
                      onChange={(e) => updateTalent(i, { date: e.target.value || undefined })}
                      className="h-8 w-32"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="time"
                      value={talent.startTime ?? ""}
                      onChange={(e) => updateTalent(i, { startTime: e.target.value || undefined })}
                      className="h-8 w-24"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={talent.location ?? ""}
                      onChange={(e) => updateTalent(i, { location: e.target.value || undefined })}
                      className="h-8"
                      placeholder="場所"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

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
