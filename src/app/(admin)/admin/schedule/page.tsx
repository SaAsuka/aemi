import Link from "next/link"
import { getSchedules } from "@/lib/actions/schedule"
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
import { SCHEDULE_STATUS_LABELS } from "@/types"
import { formatDate } from "@/lib/utils/date"
import { ScheduleStatusSelect } from "@/components/admin/schedule-status-select"
import { MonthNav } from "@/components/admin/month-nav"
import { NewScheduleDialog } from "@/components/admin/new-schedule-dialog"
import { ScheduleFilters } from "@/components/admin/schedule-filters"
import { prisma } from "@/lib/db"

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; talent?: string; job?: string }>
}) {
  const { month, talent, job } = await searchParams
  const currentMonth =
    month ?? new Date().toISOString().slice(0, 7)

  const schedules = await getSchedules({ month: currentMonth, talent, job })
  const hasFilters = !!(talent || job)
  const acceptedApplications = await prisma.application.findMany({
    where: {
      status: "ACCEPTED",
      schedule: null,
    },
    include: {
      talent: true,
      job: true,
    },
    orderBy: { appliedAt: "desc" },
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl sm:text-2xl font-bold">スケジュール管理</h1>
        <NewScheduleDialog applications={acceptedApplications} />
      </div>

      <MonthNav currentMonth={currentMonth} />

      <ScheduleFilters />

      <Card>
        <CardHeader>
          <CardTitle>
            {currentMonth} のスケジュール（{schedules.length}件）{hasFilters && <span className="ml-2 text-sm font-normal text-muted-foreground">フィルタ中</span>}
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>日付</TableHead>
                <TableHead className="hidden sm:table-cell">時間</TableHead>
                <TableHead>タレント</TableHead>
                <TableHead className="hidden sm:table-cell">案件</TableHead>
                <TableHead className="hidden md:table-cell">場所</TableHead>
                <TableHead>ステータス</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schedules.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    スケジュールがありません
                  </TableCell>
                </TableRow>
              ) : (
                schedules.map((schedule) => (
                  <TableRow key={schedule.id}>
                    <TableCell>
                      {formatDate(schedule.date)}
                      <p className="text-xs text-muted-foreground sm:hidden">
                        {schedule.startTime && `${schedule.startTime}〜${schedule.endTime ?? ""}`}
                      </p>
                      <p className="text-xs text-muted-foreground sm:hidden">
                        {schedule.application.job.title}
                      </p>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {schedule.startTime && schedule.endTime
                        ? `${schedule.startTime}〜${schedule.endTime}`
                        : schedule.startTime ?? "−"}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/admin/talents/${schedule.application.talent.id}`}
                        className="hover:underline"
                      >
                        {schedule.application.talent.name}
                      </Link>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Link
                        href={`/admin/jobs/${schedule.application.job.id}`}
                        className="hover:underline"
                      >
                        {schedule.application.job.title}
                      </Link>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{schedule.location ?? "−"}</TableCell>
                    <TableCell>
                      <StatusBadge
                        status={schedule.status}
                        label={SCHEDULE_STATUS_LABELS[schedule.status]}
                      />
                    </TableCell>
                    <TableCell>
                      <ScheduleStatusSelect
                        scheduleId={schedule.id}
                        currentStatus={schedule.status}
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
