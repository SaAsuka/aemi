"use client"

import { useState } from "react"
import Link from "next/link"
import { Check } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatShortDeadline, dateCountdown, deadlineFollowUpStatus } from "@/lib/utils/date"
import { firstShortDateByType, firstRawDateByType } from "@/lib/utils/job-dates"
import { ApplicationStatusSelect } from "@/components/admin/application-status-select"
import { ApplicationRowActions } from "@/components/admin/application-row-actions"
import { SubmissionLinks } from "@/components/admin/submission-links"
import { BulkActionsBar } from "@/components/admin/bulk-actions-bar"
import { SortableHeader } from "@/components/admin/sortable-header"
import { Pagination } from "@/components/admin/pagination"
import { InvoiceCreateDialog } from "@/components/admin/invoice-create-dialog"
import { TalentAvatar } from "@/components/admin/talent-avatar"
import { INVOICE_STATUS_LABELS, INVOICE_TONE, StatusChip } from "@/components/admin/status-chip"

type AppRow = {
  id: string
  status: string
  appliedAt: Date
  talent: {
    id: string
    name: string
    profileImage: string | null
    birthDate: Date | null
    height: number | null
    gender: string | null
    nearestStation: string | null
    resume: string | null
  }
  job: {
    id: string
    title: string
    deadline: Date | null
    fee: number | null
    dates: { date: Date; type: string }[]
  }
  submissions: {
    id: string
    category: string
    fileUrl: string | null
    externalUrl: string | null
    fileName: string | null
  }[]
  invoices: { id: string; status: string; freeeInvoiceNumber: string | null }[]
  schedule?: { date: Date; status?: string } | null
}

type ProductionCompanyOption = {
  id: string
  companyName: string
}

// 表の見出しはスクロールしても画面上端に残す。上端の余白（レイアウトの p-3 / sm:p-6）ぶん上にずらす
const HEAD = "-top-3 h-11 bg-neutral-50 px-3 text-xs font-medium text-neutral-500 sm:-top-6"
const CELL = "px-3 py-3 align-middle"
const PAGER_BUTTON = "size-8 rounded-lg border-neutral-300 bg-white hover:bg-neutral-50"
const INVOICE_BUTTON = "h-7 rounded-md border-neutral-300 bg-white text-xs text-neutral-800 hover:border-neutral-400 hover:bg-neutral-50"

// 残り日数などの注意書きの色（オレンジ＝3日以内 → 赤、黄＝1週間以内 → 黄）
function noteTone(className: string) {
  return /red|orange/.test(className) ? "font-medium text-red-600" : "text-yellow-700"
}

function Checkbox({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <span className="relative flex size-5 shrink-0 items-center justify-center">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        aria-label={label}
        className="peer absolute inset-0 cursor-pointer appearance-none rounded-[5px] border border-neutral-400 bg-white checked:border-neutral-950 checked:bg-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950/30"
      />
      <Check className="pointer-events-none relative size-3.5 text-white opacity-0 peer-checked:opacity-100" aria-hidden="true" />
    </span>
  )
}

// 締切・オーディション・撮影を1か所にまとめて表示する
function Schedule({ app }: { app: AppRow }) {
  const rows: { label: string; value: string; note?: { label: string; className: string } | null }[] = []
  if (app.job.deadline) {
    rows.push({ label: "締切", value: formatShortDeadline(app.job.deadline), note: deadlineFollowUpStatus(app.job.deadline) })
  }
  const audition = firstShortDateByType(app.job.dates, "AUDITION")
  if (audition) rows.push({ label: "オーディション", value: audition, note: dateCountdown(firstRawDateByType(app.job.dates, "AUDITION")) })
  const shooting = firstShortDateByType(app.job.dates, "SHOOTING")
  if (shooting) rows.push({ label: "撮影", value: shooting, note: dateCountdown(firstRawDateByType(app.job.dates, "SHOOTING")) })

  if (rows.length === 0) return <span className="text-xs text-neutral-400">—</span>
  return (
    <span className="block space-y-0.5 text-xs">
      {rows.map((r) => (
        <span key={r.label} className="block whitespace-nowrap">
          <span className="text-neutral-500">{r.label}</span> <span className="tabular-nums text-neutral-950">{r.value}</span>
          {r.note && <span className={`ml-1.5 ${noteTone(r.note.className)}`}>{r.note.label}</span>}
        </span>
      ))}
    </span>
  )
}

export function ApplicationTable({
  applications,
  totalCount,
  productionCompanies = [],
}: {
  applications: AppRow[]
  totalCount: number
  productionCompanies?: ProductionCompanyOption[]
}) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const allChecked = applications.length > 0 && applications.every((a) => selectedIds.has(a.id))

  function toggleAll() {
    if (allChecked) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(applications.map((a) => a.id)))
    }
  }

  function toggleOne(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const invoice = (app: AppRow) =>
    app.status === "ACCEPTED" ? (
      <span className="flex flex-wrap items-center gap-1.5">
        {app.invoices[0] && (
          <StatusChip
            tone={INVOICE_TONE[app.invoices[0].status] ?? "gray"}
            label={`請求書 ${INVOICE_STATUS_LABELS[app.invoices[0].status] ?? app.invoices[0].status}`}
          />
        )}
        <InvoiceCreateDialog
          applicationId={app.id}
          jobTitle={app.job.title}
          jobFee={app.job.fee}
          talentName={app.talent.name}
          productionCompanies={productionCompanies}
          existingInvoice={app.invoices[0] ?? null}
          triggerClassName={INVOICE_BUTTON}
        />
      </span>
    ) : (
      <span className="text-xs text-neutral-400" title="合格した応募だけ請求書を作れます">
        —
      </span>
    )

  const statusSelect = (app: AppRow) => (
    <ApplicationStatusSelect
      applicationId={app.id}
      currentStatus={app.status}
      scheduleDate={app.schedule?.date ?? null}
      scheduleStatus={app.schedule?.status ?? null}
      talentName={app.talent.name}
      jobTitle={app.job.title}
    />
  )

  if (applications.length === 0) return null

  return (
    <>
      {/* 広い画面：表 */}
      <div className="hidden xl:block">
        <Table>
          <TableHeader className="[&_tr]:border-neutral-200">
            <TableRow className="hover:bg-transparent">
              <TableHead className={`${HEAD} w-12 pl-5`}>
                <Checkbox checked={allChecked} onChange={toggleAll} label="このページの応募をすべて選ぶ" />
              </TableHead>
              <SortableHeader column="talent" label="タレント" className={HEAD} />
              <SortableHeader column="job" label="案件" className={HEAD} />
              <TableHead className={HEAD}>日程</TableHead>
              <TableHead className={HEAD}>提出物</TableHead>
              <SortableHeader column="status" label="選考の状況" className={HEAD} />
              <TableHead className={HEAD}>請求書</TableHead>
              <TableHead className={`${HEAD} w-10 pr-5`}>
                <span className="sr-only">その他の操作</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {applications.map((app) => {
              const checked = selectedIds.has(app.id)
              return (
                <TableRow
                  key={app.id}
                  className={`border-neutral-100 ${checked ? "bg-neutral-50" : "hover:bg-neutral-50/60"}`}
                >
                  <TableCell className={`${CELL} pl-5`}>
                    <Checkbox checked={checked} onChange={() => toggleOne(app.id)} label={`${app.talent.name}さんの応募を選ぶ`} />
                  </TableCell>
                  <TableCell className={CELL}>
                    <Link
                      href={`/admin/talents/${app.talent.id}`}
                      className="flex items-center gap-2.5 text-sm font-medium text-neutral-950 underline-offset-4 hover:underline"
                    >
                      <TalentAvatar url={app.talent.profileImage} name={app.talent.name} className="size-8 text-xs" />
                      <span className="whitespace-nowrap">{app.talent.name}</span>
                    </Link>
                  </TableCell>
                  <TableCell className={`${CELL} min-w-[14rem] max-w-[20rem] whitespace-normal`}>
                    <Link href={`/admin/jobs/${app.job.id}`} className="text-sm text-neutral-950 underline-offset-4 hover:underline">
                      {app.job.title}
                    </Link>
                  </TableCell>
                  <TableCell className={CELL}>
                    <Schedule app={app} />
                  </TableCell>
                  <TableCell className={`${CELL} max-w-[10rem] whitespace-normal`}>
                    <SubmissionLinks submissions={app.submissions} />
                  </TableCell>
                  <TableCell className={CELL}>
                    <div className="w-32">{statusSelect(app)}</div>
                  </TableCell>
                  <TableCell className={CELL}>{invoice(app)}</TableCell>
                  <TableCell className={`${CELL} pr-5`}>
                    <ApplicationRowActions applicationId={app.id} talent={app.talent} />
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* スマホ・タブレット・狭いPC：カード */}
      <div className="xl:hidden">
        <label className="flex cursor-pointer items-center gap-3 border-b border-neutral-100 px-4 py-2.5 text-xs text-neutral-600 sm:px-5">
          <Checkbox checked={allChecked} onChange={toggleAll} label="このページの応募をすべて選ぶ" />
          このページの応募をすべて選ぶ
        </label>
        <ul className="divide-y divide-neutral-100">
          {applications.map((app) => {
            const checked = selectedIds.has(app.id)
            return (
              <li key={app.id} className={`flex gap-3 px-4 py-4 sm:px-5 ${checked ? "bg-neutral-50" : ""}`}>
                <div className="pt-1.5">
                  <Checkbox checked={checked} onChange={() => toggleOne(app.id)} label={`${app.talent.name}さんの応募を選ぶ`} />
                </div>
                <div className="min-w-0 flex-1 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <Link href={`/admin/talents/${app.talent.id}`} className="flex min-w-0 items-center gap-2.5">
                      <TalentAvatar url={app.talent.profileImage} name={app.talent.name} className="size-9 text-xs" />
                      <span className="truncate text-sm font-medium text-neutral-950">{app.talent.name}</span>
                    </Link>
                    <ApplicationRowActions applicationId={app.id} talent={app.talent} />
                  </div>
                  <Link href={`/admin/jobs/${app.job.id}`} className="block text-sm leading-snug text-neutral-950 underline-offset-4 hover:underline">
                    {app.job.title}
                  </Link>
                  <Schedule app={app} />
                  {app.submissions.length > 0 && <SubmissionLinks submissions={app.submissions} />}
                  <div className="flex flex-wrap items-center gap-2 pt-0.5">
                    <div className="w-36">{statusSelect(app)}</div>
                    {app.status === "ACCEPTED" && invoice(app)}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      </div>

      <Pagination total={totalCount} className="border-t border-neutral-200 px-4 sm:px-5" buttonClassName={PAGER_BUTTON} />

      <BulkActionsBar selectedIds={Array.from(selectedIds)} onClear={() => setSelectedIds(new Set())} />
    </>
  )
}
