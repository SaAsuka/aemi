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
import { StatusBadge } from "@/components/admin/status-badge"
import { APPLICATION_STATUS_LABELS } from "@/types"
import { StatusFilter } from "@/components/admin/status-filter"
import { formatDate } from "@/lib/utils/date"
import { ApplicationStatusSelect } from "@/components/admin/application-status-select"
import { NewApplicationDialog } from "@/components/admin/new-application-dialog"
import { Button } from "@/components/ui/button"
import { CopyReviewLinkButton } from "@/components/admin/copy-review-link-button"
import { ReviewResultBadge } from "@/components/admin/review-result-badge"

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
        <Suspense fallback={<Button variant="outline" size="sm" disabled>新規応募</Button>}>
          <ApplicationDialogData />
        </Suspense>
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
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>タレント</TableHead>
                <TableHead>案件</TableHead>
                <TableHead className="hidden sm:table-cell">クライアント</TableHead>
                <TableHead>ステータス</TableHead>
                <TableHead className="hidden sm:table-cell">応募日</TableHead>
                <TableHead>送信</TableHead>
                <TableHead>回答</TableHead>
                <TableHead>操作</TableHead>
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
                  <TableRow key={app.id}>
                    <TableCell>
                      <Link
                        href={`/admin/talents/${app.talent.id}`}
                        className="hover:underline"
                      >
                        {app.talent.name}
                      </Link>
                      <p className="text-xs text-muted-foreground sm:hidden">
                        {app.job.client.companyName} · {formatDate(app.appliedAt)}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/admin/jobs/${app.job.id}`}
                        className="hover:underline"
                      >
                        {app.job.title}
                      </Link>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{app.job.client.companyName}</TableCell>
                    <TableCell>
                      <StatusBadge
                        status={app.status}
                        label={APPLICATION_STATUS_LABELS[app.status]}
                      />
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{formatDate(app.appliedAt)}</TableCell>
                    <TableCell>
                      <CopyReviewLinkButton
                        applicationId={app.id}
                        currentStatus={app.status}
                      />
                    </TableCell>
                    <TableCell>
                      <ReviewResultBadge
                        data={{
                          status: app.status,
                          reviewedAt: app.reviewedAt,
                          preferredDate: app.preferredDate,
                          preferredTime: app.preferredTime,
                          reviewComment: app.reviewComment,
                          rejectionReason: app.rejectionReason,
                          talentName: app.talent.name,
                          jobTitle: app.job.title,
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <ApplicationStatusSelect
                        applicationId={app.id}
                        currentStatus={app.status}
                        talentName={app.talent.name}
                        jobTitle={app.job.title}
                      />
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
