import Link from "next/link"
import { getApplications } from "@/lib/actions/application"
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
import { prisma } from "@/lib/db"

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams
  const applications = await getApplications(status)
  const talents = await prisma.talent.findMany({
    where: { status: "ACTIVE" },
    orderBy: { name: "asc" },
    select: { id: true, name: true, nameKana: true },
  })
  const jobs = await prisma.job.findMany({
    where: { status: "OPEN" },
    orderBy: { title: "asc" },
    select: { id: true, title: true },
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl sm:text-2xl font-bold">応募管理</h1>
        <NewApplicationDialog talents={talents} jobs={jobs} />
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
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
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
