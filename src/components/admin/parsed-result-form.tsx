"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ChevronDown, ChevronRight } from "lucide-react"
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
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { applyParsedJobs } from "@/lib/actions/apply-parsed-job"
import type { ParseResult, ParsedCommon, ParsedRole, ParsedTalentEntry } from "@/lib/validations/parsed-job"

const GENDER_LABELS: Record<string, string> = {
  MALE: "男性",
  FEMALE: "女性",
  OTHER: "その他",
}

const GENDER_OPTIONS = [
  { value: "NONE", label: "指定なし" },
  { value: "MALE", label: "男性" },
  { value: "FEMALE", label: "女性" },
  { value: "OTHER", label: "その他" },
] as const

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

function toDatetimeLocal(v: string | null | undefined): string {
  if (!v) return ""
  return v.slice(0, 16)
}

type RoleState = {
  checked: boolean
  expanded: boolean
  mode: "create" | "existing"
  existingJobId: string
  title: string
  genderReq: string
  ageMin: string
  ageMax: string
  heightMin: string
  heightMax: string
  fee: string
  capacity: string
  note: string
}

function initRoleState(role: ParsedRole, existingJobId: string | null): RoleState {
  const talentNote = buildTalentNote(role.talents)
  const roleNote = role.note ?? ""
  const combinedNote = [roleNote, talentNote].filter(Boolean).join("\n\n")

  return {
    checked: true,
    expanded: false,
    mode: existingJobId ? "existing" : "create",
    existingJobId: existingJobId ?? "",
    title: role.title,
    genderReq: role.genderReq ?? "NONE",
    ageMin: role.ageMin?.toString() ?? "",
    ageMax: role.ageMax?.toString() ?? "",
    heightMin: role.heightMin?.toString() ?? "",
    heightMax: role.heightMax?.toString() ?? "",
    fee: role.fee?.toString() ?? "",
    capacity: role.capacity?.toString() ?? "",
    note: combinedNote,
  }
}

function RoleSummary({ role }: { role: RoleState }) {
  const parts: string[] = []
  if (role.genderReq !== "NONE") parts.push(GENDER_LABELS[role.genderReq] ?? role.genderReq)
  if (role.ageMin || role.ageMax) {
    parts.push(`${role.ageMin || "?"}〜${role.ageMax || "?"}歳`)
  }
  if (role.fee) parts.push(`¥${Number(role.fee).toLocaleString()}`)
  if (role.capacity) parts.push(`${role.capacity}名`)
  return (
    <span className="text-sm text-muted-foreground">
      {parts.length > 0 ? parts.join(" / ") : "詳細未設定"}
    </span>
  )
}

export function ParsedResultForm({
  data,
  onSuccess,
}: {
  data: ParseResult
  onSuccess: () => void
}) {
  const router = useRouter()
  const [common, setCommon] = useState({
    location: data.common.location ?? "",
    startsAt: toDatetimeLocal(data.common.startsAt),
    endsAt: toDatetimeLocal(data.common.endsAt),
    deadline: toDatetimeLocal(data.common.deadline),
    dates: data.common.dates ?? "",
    description: data.common.description ?? "",
    commonNote: data.common.note ?? "",
    clientCompanyName: data.common.clientCompanyName ?? "",
  })
  const [roles, setRoles] = useState<RoleState[]>(
    data.jobs.map((j) => initRoleState(j.role, j.existingJobId))
  )
  const [saving, setSaving] = useState(false)

  const checkedCount = roles.filter((r) => r.checked).length

  const updateCommon = (key: keyof typeof common, value: string) => {
    setCommon((prev) => ({ ...prev, [key]: value }))
  }

  const updateRole = (index: number, updates: Partial<RoleState>) => {
    setRoles((prev) => prev.map((r, i) => (i === index ? { ...r, ...updates } : r)))
  }

  const handleSubmit = async () => {
    const selected = roles.filter((r) => r.checked)
    if (selected.length === 0) {
      toast.error("登録する役柄を選択してください")
      return
    }
    for (const r of selected) {
      if (!r.title.trim()) {
        toast.error("案件名が未入力の役柄があります")
        return
      }
    }

    setSaving(true)

    const inputs = selected.map((r) => {
      const mergedNote = [common.commonNote, r.note].filter(Boolean).join("\n\n")
      return {
        mode: r.mode as "create" | "existing",
        existingJobId: r.mode === "existing" ? r.existingJobId : undefined,
        title: r.title,
        description: common.description || undefined,
        location: common.location || undefined,
        fee: r.fee ? parseInt(r.fee, 10) : undefined,
        genderReq: r.genderReq !== "NONE" ? (r.genderReq as "MALE" | "FEMALE" | "OTHER") : undefined,
        ageMin: r.ageMin ? parseInt(r.ageMin, 10) : undefined,
        ageMax: r.ageMax ? parseInt(r.ageMax, 10) : undefined,
        heightMin: r.heightMin ? parseInt(r.heightMin, 10) : undefined,
        heightMax: r.heightMax ? parseInt(r.heightMax, 10) : undefined,
        startsAt: common.startsAt || undefined,
        endsAt: common.endsAt || undefined,
        deadline: common.deadline || undefined,
        capacity: r.capacity ? parseInt(r.capacity, 10) : undefined,
        note: mergedNote || undefined,
      }
    })

    const result = await applyParsedJobs(inputs)
    setSaving(false)

    if (result.success) {
      toast.success(`${result.count}件の案件を保存しました`)
      router.refresh()
      onSuccess()
    } else {
      toast.error(result.error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="font-semibold">共通情報</h3>

        <div className="space-y-1">
          <Label>クライアント名</Label>
          <Input
            value={common.clientCompanyName}
            onChange={(e) => updateCommon("clientCompanyName", e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <Label>案件説明</Label>
          <Textarea
            value={common.description}
            onChange={(e) => updateCommon("description", e.target.value)}
            rows={2}
          />
        </div>

        <div className="space-y-1">
          <Label>場所</Label>
          <Input
            value={common.location}
            onChange={(e) => updateCommon("location", e.target.value)}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <Label>開始日時</Label>
            <Input
              type="datetime-local"
              value={common.startsAt}
              onChange={(e) => updateCommon("startsAt", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label>終了日時</Label>
            <Input
              type="datetime-local"
              value={common.endsAt}
              onChange={(e) => updateCommon("endsAt", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label>応募締切</Label>
            <Input
              type="datetime-local"
              value={common.deadline}
              onChange={(e) => updateCommon("deadline", e.target.value)}
            />
          </div>
        </div>

        {common.dates && (
          <div className="text-sm text-muted-foreground">
            日程情報（原文）: {common.dates}
          </div>
        )}

        <div className="space-y-1">
          <Label>共通備考</Label>
          <Textarea
            value={common.commonNote}
            onChange={(e) => updateCommon("commonNote", e.target.value)}
            rows={2}
          />
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="font-semibold">役柄一覧（{roles.length}件）</h3>

        {roles.map((role, i) => (
          <Card key={i} size="sm" className={!role.checked ? "opacity-50" : ""}>
            <CardHeader className="cursor-pointer" onClick={() => updateRole(i, { expanded: !role.expanded })}>
              <div className="flex items-center gap-3 w-full">
                <input
                  type="checkbox"
                  checked={role.checked}
                  onChange={(e) => {
                    e.stopPropagation()
                    updateRole(i, { checked: e.target.checked })
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="h-4 w-4 shrink-0"
                />
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {role.expanded ? (
                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                  <CardTitle className="truncate">{role.title || "（無題）"}</CardTitle>
                </div>
                <RoleSummary role={role} />
              </div>
            </CardHeader>

            {role.expanded && (
              <CardContent className="space-y-4 pt-0">
                <div className="flex gap-4 items-center">
                  <Label>モード</Label>
                  <Select
                    value={role.mode}
                    onValueChange={(v) => updateRole(i, { mode: v as "create" | "existing" })}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="create">新規作成</SelectItem>
                      <SelectItem value="existing">既存案件に紐付け</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {role.mode === "existing" && (
                  <div className="space-y-1">
                    <Label>既存案件ID</Label>
                    <Input
                      value={role.existingJobId}
                      onChange={(e) => updateRole(i, { existingJobId: e.target.value })}
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <Label>案件名</Label>
                  <Input
                    value={role.title}
                    onChange={(e) => updateRole(i, { title: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>報酬（円）</Label>
                    <Input
                      type="number"
                      value={role.fee}
                      onChange={(e) => updateRole(i, { fee: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>募集人数</Label>
                    <Input
                      type="number"
                      value={role.capacity}
                      onChange={(e) => updateRole(i, { capacity: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <Label>性別条件</Label>
                    <Select
                      value={role.genderReq}
                      onValueChange={(v) => updateRole(i, { genderReq: v ?? "NONE" })}
                    >
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
                    <Input
                      type="number"
                      value={role.ageMin}
                      onChange={(e) => updateRole(i, { ageMin: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>年齢（上限）</Label>
                    <Input
                      type="number"
                      value={role.ageMax}
                      onChange={(e) => updateRole(i, { ageMax: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>身長（下限cm）</Label>
                    <Input
                      type="number"
                      value={role.heightMin}
                      onChange={(e) => updateRole(i, { heightMin: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>身長（上限cm）</Label>
                    <Input
                      type="number"
                      value={role.heightMax}
                      onChange={(e) => updateRole(i, { heightMax: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label>役柄備考</Label>
                  <Textarea
                    value={role.note}
                    onChange={(e) => updateRole(i, { note: e.target.value })}
                    rows={3}
                  />
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onSuccess}>
          キャンセル
        </Button>
        <Button onClick={handleSubmit} disabled={saving || checkedCount === 0}>
          {saving ? "保存中..." : `選択した${checkedCount}件を一括保存`}
        </Button>
      </div>
    </div>
  )
}
