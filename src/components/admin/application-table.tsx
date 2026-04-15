"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatShortDeadline } from "@/lib/utils/date"
import { firstShortDateByType } from "@/lib/utils/job-dates"
import { ApplicationStatusSelect } from "@/components/admin/application-status-select"
import { ApplicationRowActions } from "@/components/admin/application-row-actions"
import { SubmissionLinks } from "@/components/admin/submission-links"
import { BulkActionsBar } from "@/components/admin/bulk-actions-bar"
import { SortableHeader } from "@/components/admin/sortable-header"
import { Pagination } from "@/components/admin/pagination"
import { blobProxyUrl } from "@/lib/utils/blob"

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
    dates: { date: Date; type: string }[]
  }
  submissions: {
    id: string
    category: string
    fileUrl: string | null
    externalUrl: string | null
    fileName: string | null
  }[]
}

export function ApplicationTable({
  applications,
  totalCount,
}: {
  applications: AppRow[]
  totalCount: number
}) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const allChecked = applications.length > 0 && applications.every(a => selectedIds.has(a.id))

  function toggleAll() {
    if (allChecked) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(applications.map(a => a.id)))
    }
  }

  function toggleOne(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <>
      <BulkActionsBar
        selectedIds={Array.from(selectedIds)}
        onClear={() => setSelectedIds(new Set())}
      />
      <Table className="table-fixed w-full text-xs">
        <TableHeader>
          <TableRow>
            <TableHead className="w-7 px-1">
              <input
                type="checkbox"
                checked={allChecked}
                onChange={toggleAll}
                className="h-3.5 w-3.5 rounded border-gray-300"
              />
            </TableHead>
            <SortableHeader column="talent" label="タレント" className="w-[90px] px-2" />
            <SortableHeader column="job" label="案件" className="w-[280px] px-2" />
            <TableHead className="hidden sm:table-cell w-[52px] px-2">提出物</TableHead>
            <TableHead className="hidden sm:table-cell w-[52px] px-2">締切日</TableHead>
            <TableHead className="hidden md:table-cell w-[52px] px-2">オーディション</TableHead>
            <TableHead className="hidden md:table-cell w-[52px] px-2">撮影</TableHead>
            <SortableHeader column="status" label="ステータス" className="w-[108px] px-2" />
            <TableHead className="w-9 px-1" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {applications.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center text-muted-foreground">
                データがありません
              </TableCell>
            </TableRow>
          ) : (
            applications.map((app) => (
              <TableRow key={app.id} className={selectedIds.has(app.id) ? "bg-primary/5" : ""}>
                <TableCell className="px-1 py-1.5">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(app.id)}
                    onChange={() => toggleOne(app.id)}
                    className="h-3.5 w-3.5 rounded border-gray-300"
                  />
                </TableCell>
                <TableCell className="truncate px-2 py-1.5">
                  <Link
                    href={`/admin/talents/${app.talent.id}`}
                    className="inline-flex items-center gap-1 hover:underline min-w-0"
                  >
                    {app.talent.profileImage ? (
                      <img src={blobProxyUrl(app.talent.profileImage)} alt="" className="h-5 w-5 shrink-0 rounded-full object-cover" />
                    ) : (
                      <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px]">{app.talent.name.charAt(0)}</span>
                    )}
                    <span className="truncate">{app.talent.name}</span>
                  </Link>
                </TableCell>
                <TableCell className="truncate px-2 py-1.5" title={app.job.title}>
                  <Link
                    href={`/admin/jobs/${app.job.id}`}
                    className="hover:underline"
                  >
                    {app.job.title}
                  </Link>
                </TableCell>
                <TableCell className="hidden sm:table-cell px-2 py-1.5">
                  <SubmissionLinks submissions={app.submissions} />
                </TableCell>
                <TableCell className="hidden sm:table-cell px-2 py-1.5 whitespace-nowrap">
                  {app.job.deadline ? formatShortDeadline(app.job.deadline) : "−"}
                </TableCell>
                <TableCell className="hidden md:table-cell px-2 py-1.5 whitespace-nowrap">
                  {firstShortDateByType(app.job.dates, "AUDITION") ?? "−"}
                </TableCell>
                <TableCell className="hidden md:table-cell px-2 py-1.5 whitespace-nowrap">
                  {firstShortDateByType(app.job.dates, "SHOOTING") ?? "−"}
                </TableCell>
                <TableCell className="px-2 py-1.5">
                  <ApplicationStatusSelect
                    applicationId={app.id}
                    currentStatus={app.status}
                    talentName={app.talent.name}
                    jobTitle={app.job.title}
                  />
                </TableCell>
                <TableCell className="px-1 py-1.5">
                  <ApplicationRowActions
                    applicationId={app.id}
                    talent={app.talent}
                  />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      <Pagination total={totalCount} />
    </>
  )
}
