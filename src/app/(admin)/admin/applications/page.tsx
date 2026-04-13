import { Suspense } from "react"
import Link from "next/link"
import { getApplications } from "@/lib/actions/application"
import { getActiveTalentOptions, getOpenJobOptions } from "@/lib/queries"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { StatusFilter } from "@/components/admin/status-filter"
import { formatDate } from "@/lib/utils/date"
import { firstDateByType } from "@/lib/utils/job-dates"
import { ApplicationStatusSelect } from "@/components/admin/application-status-select"
import { NewApplicationDialog } from "@/components/admin/new-application-dialog"
import { LineCopyButton } from "@/components/admin/line-copy-button"
import { Button } from "@/components/ui/button"
import { SubmissionLinks } from "@/components/admin/submission-links"
import { DeleteApplicationButton } from "@/components/admin/delete-application-button"
import { CsvExportButton } from "@/components/admin/csv-export-button"
import { exportApplicationsCsv } from "@/lib/actions/export"

async function ApplicationDialogData() {
  const [talents, jobs] = await Promise.all([
    getActiveTalentOptions(),
    getOpenJobOptions(),
  ])
  return <NewApplicationDialog talents={talents} jobs={jobs} />
}

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams
  const applications = await getApplications(status)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl sm:text-2xl font-bold">応募管理</h1>
        <div className="flex items-center gap-2">
          <CsvExportButton action={exportApplicationsCsv} filename="応募一覧.csv" />
          <Suspense fallback={<Button variant="outline" size="sm" disabled>新規応募</Button>}>
            <ApplicationDialogData />
          </Suspense>
        </div>
      </div>

      <StatusFilter
        options={[
          { value: "ALL", label: "すべて" },
          { value: "APPLIED", label: "応募済み" },
          { value: "RESUME_SENT", label: "書類送付済" },
          { value: "ACCEPTED", label: "合格" },
          { value: "REJECTED", label: "不合格" },
          { value: "AUTO_REJECTED", label: "自動不合格" },
          { value: "CANCELLED", label: "キャンセル" },
        ]}
        defaultValue={status}
      />

      <Card>
        <CardHeader>
          <CardTitle>応募一覧（{applications.length}件）</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>タレント</TableHead>
                <TableHead>案件</TableHead>
                <TableHead className="hidden sm:table-cell">提出物</TableHead>
                <TableHead className="hidden sm:table-cell">締切日</TableHead>
                <TableHead className="hidden md:table-cell">オーディション</TableHead>
                <TableHead className="hidden md:table-cell">撮影</TableHead>
                <TableHead>ステータス</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    データがありません
                  </TableCell>
                </TableRow>
              ) : (
                applications.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell>
                      <Link
                        href={`/admin/talents/${app.talent.id}`}
                        className="hover:underline"
                      >
                        {app.talent.name}
                      </Link>
                    </TableCell>
                    <TableCell>
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
                      {app.job.deadline ? formatDate(app.job.deadline) : "−"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {firstDateByType(app.job.dates, "AUDITION") ?? "−"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {firstDateByType(app.job.dates, "SHOOTING") ?? "−"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
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
        </CardContent>
      </Card>
    </div>
  )
}
