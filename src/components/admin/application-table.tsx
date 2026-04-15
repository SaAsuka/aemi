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
import { formatDate, formatDeadline } from "@/lib/utils/date"
import { firstDateByType } from "@/lib/utils/job-dates"
import { ApplicationStatusSelect } from "@/components/admin/application-status-select"
import { LineCopyButton } from "@/components/admin/line-copy-button"
import { SubmissionLinks } from "@/components/admin/submission-links"
import { DeleteApplicationButton } from "@/components/admin/delete-application-button"
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
      <Table className="table-fixed w-full">
        <TableHeader>
          <TableRow>
            <TableHead className="w-8">
              <input
                type="checkbox"
                checked={allChecked}
                onChange={toggleAll}
                className="h-4 w-4 rounded border-gray-300"
              />
            </TableHead>
            <SortableHeader column="talent" label="タレント" className="w-[100px]" />
            <SortableHeader column="job" label="案件" />
            <TableHead className="hidden sm:table-cell w-[60px]">提出物</TableHead>
            <TableHead className="hidden sm:table-cell w-[90px]">締切日</TableHead>
            <TableHead className="hidden md:table-cell w-[90px]">オーディション</TableHead>
            <TableHead className="hidden md:table-cell w-[90px]">撮影</TableHead>
            <SortableHeader column="status" label="ステータス" className="w-[220px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {applications.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-muted-foreground">
                データがありません
              </TableCell>
            </TableRow>
          ) : (
            applications.map((app) => (
              <TableRow key={app.id} className={selectedIds.has(app.id) ? "bg-primary/5" : ""}>
                <TableCell>
                  <input
                    type="checkbox"
                    checked={selectedIds.has(app.id)}
                    onChange={() => toggleOne(app.id)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                </TableCell>
                <TableCell className="truncate">
                  <Link
                    href={`/admin/talents/${app.talent.id}`}
                    className="inline-flex items-center gap-1.5 hover:underline min-w-0"
                  >
                    {app.talent.profileImage ? (
                      <img src={blobProxyUrl(app.talent.profileImage)} alt="" className="h-6 w-6 shrink-0 rounded-full object-cover" />
                    ) : (
                      <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs">{app.talent.name.charAt(0)}</span>
                    )}
                    <span className="truncate">{app.talent.name}</span>
                  </Link>
                </TableCell>
                <TableCell className="truncate" title={app.job.title}>
                  <Link
                    href={`/admin/jobs/${app.job.id}`}
                    className="hover:underline"
                  >
                    {app.job.title}
                  </Link>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <SubmissionLinks submissions={app.submissions} />
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  {app.job.deadline ? formatDeadline(app.job.deadline) : "−"}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {firstDateByType(app.job.dates, "AUDITION") ?? "−"}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {firstDateByType(app.job.dates, "SHOOTING") ?? "−"}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap items-center gap-1">
                    <LineCopyButton talent={app.talent} />
                    <ApplicationStatusSelect
                      applicationId={app.id}
                      currentStatus={app.status}
                      talentName={app.talent.name}
                      jobTitle={app.job.title}
                    />
                    <DeleteApplicationButton applicationId={app.id} />
                  </div>
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
