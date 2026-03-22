import Link from "next/link"
import { getJobs } from "@/lib/actions/job"
import { LinkButton } from "@/components/admin/link-button"
import { ParseJobSheet } from "@/components/admin/parse-job-sheet"
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
import { formatDate } from "@/lib/utils/date"

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>
}) {
  const { q, status } = await searchParams
  const jobs = await getJobs(q, status)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl sm:text-2xl font-bold">案件管理</h1>
        <div className="flex gap-2">
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
      </div>

      <Card>
        <CardHeader>
          <CardTitle>案件一覧（{jobs.length}件）</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>案件名</TableHead>
                <TableHead>報酬</TableHead>
                <TableHead className="hidden sm:table-cell">締切</TableHead>
                <TableHead>応募数</TableHead>
                <TableHead>ステータス</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
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
                      {job.deadline ? formatDate(job.deadline) : "−"}
                    </TableCell>
                    <TableCell>{job._count.applications}</TableCell>
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
        </CardContent>
      </Card>
    </div>
  )
}
