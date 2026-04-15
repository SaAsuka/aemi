import Link from "next/link"
import { getJobs, getJobCount } from "@/lib/actions/job"
import { getActiveTalentsForMatching } from "@/lib/actions/talent"
import { LinkButton } from "@/components/admin/link-button"
import { ParseJobSheet } from "@/components/admin/parse-job-sheet"
import { TalentFilter } from "@/components/admin/talent-filter"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { StatusBadge } from "@/components/admin/status-badge"
import { JOB_STATUS_LABELS } from "@/types"
import { SearchForm } from "@/components/admin/search-form"
import { StatusFilter } from "@/components/admin/status-filter"
import { matchTalentToJob } from "@/lib/utils/job-matching"
import { formatDate, formatDeadline } from "@/lib/utils/date"
import { firstDateByType } from "@/lib/utils/job-dates"
import { Pagination } from "@/components/admin/pagination"
import { SortableHeader } from "@/components/admin/sortable-header"
import { CsvExportButton } from "@/components/admin/csv-export-button"
import { exportJobsCsv } from "@/lib/actions/export"

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; talentId?: string; sort?: string; order?: string; page?: string }>
}) {
  const { q, status, talentId, sort, order, page } = await searchParams
  const [jobs, talents, totalCount] = await Promise.all([
    getJobs(q, status, talentId, sort, order, page ? Number(page) : 1),
    getActiveTalentsForMatching(),
    getJobCount(q, status),
  ])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl sm:text-2xl font-bold">案件管理</h1>
        <div className="flex gap-2">
          <CsvExportButton action={exportJobsCsv} filename="案件一覧.csv" />
          <ParseJobSheet />
          <LinkButton href="/admin/jobs/new">新規作成</LinkButton>
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <SearchForm placeholder="案件名で検索" defaultValue={q} />
        <StatusFilter
          options={[
            { value: "ALL", label: "すべて" },
            { value: "DRAFT", label: "下書き" },
            { value: "OPEN", label: "募集中" },
            { value: "CLOSED", label: "募集終了" },
            { value: "CANCELLED", label: "キャンセル" },
          ]}
          defaultValue={status}
        />
        <TalentFilter talents={talents} defaultValue={talentId} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>案件一覧（{totalCount}件）</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <SortableHeader column="title" label="案件名" />
                <SortableHeader column="fee" label="報酬" />
                <SortableHeader column="deadline" label="締切" className="hidden sm:table-cell" />
                <TableHead className="hidden md:table-cell">オーディション</TableHead>
                <TableHead className="hidden md:table-cell">撮影</TableHead>
                <TableHead>応募</TableHead>
                <SortableHeader column="status" label="ステータス" />
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground">
                    データがありません
                  </TableCell>
                </TableRow>
              ) : (
                jobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell>
                      <Link
                        href={`/admin/jobs/${job.id}`}
                        className="font-medium hover:underline"
                      >
                        {job.title}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {job.fee ? `¥${job.fee.toLocaleString()}` : "−"}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {job.deadline ? formatDeadline(job.deadline) : "−"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {firstDateByType(job.dates, "AUDITION") ?? "−"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {firstDateByType(job.dates, "SHOOTING") ?? "−"}
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const matchCount = talents.filter(t => matchTalentToJob(t, job).matchStatus !== "unmatch").length
                        const appCount = job._count.applications
                        return (
                          <div className="text-xs space-y-0.5">
                            <div>{appCount}名応募</div>
                            <div className="text-muted-foreground">マッチ{matchCount}名</div>
                          </div>
                        )
                      })()}
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        status={job.status}
                        label={JOB_STATUS_LABELS[job.status]}
                      />
                    </TableCell>
                    <TableCell>
                      <LinkButton href={`/admin/jobs/${job.id}`} size="sm" variant="outline">
                        詳細
                      </LinkButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <Pagination total={totalCount} />
        </CardContent>
      </Card>
    </div>
  )
}
