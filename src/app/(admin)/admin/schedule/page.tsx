import { Suspense } from "react"
import { getSchedules } from "@/lib/actions/schedule"
import { getTalentFilterOptions, getJobFilterOptions } from "@/lib/queries"
import { MonthNav } from "@/components/admin/month-nav"
import { NewScheduleDialog } from "@/components/admin/new-schedule-dialog"
import { ScheduleFilters } from "@/components/admin/schedule-filters"
import { ScheduleCalendar } from "@/components/admin/schedule-calendar"
import { prisma } from "@/lib/db"
import { Button } from "@/components/ui/button"
import type { ScheduleItem } from "@/lib/utils/schedule"

async function ScheduleFiltersData() {
  const [talentOptions, jobOptions] = await Promise.all([
    getTalentFilterOptions(),
    getJobFilterOptions(),
  ])
  return <ScheduleFilters talentOptions={talentOptions} jobOptions={jobOptions} />
}

async function ScheduleDialogData() {
  const acceptedApplications = await prisma.application.findMany({
    where: {
      status: "ACCEPTED",
      schedule: null,
    },
    select: {
      id: true,
      status: true,
      talent: { select: { id: true, name: true } },
      job: { select: { id: true, title: true } },
    },
    orderBy: { appliedAt: "desc" },
  })
  return <NewScheduleDialog applications={acceptedApplications} />
}

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; talent?: string; job?: string }>
}) {
  const { month, talent, job } = await searchParams
  const currentMonth = month ?? new Date().toISOString().slice(0, 7)
  const hasFilters = !!(talent || job)

  const schedules = await getSchedules({ month: currentMonth, talent, job })

  const items: ScheduleItem[] = schedules.map((s) => ({
    id: s.id,
    date: s.date.toISOString(),
    startTime: s.startTime,
    endTime: s.endTime,
    location: s.location,
    status: s.status,
    talentId: s.application.talent.id,
    talentName: s.application.talent.name,
    jobId: s.application.job.id,
    jobTitle: s.application.job.title,
  }))

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl sm:text-2xl font-bold">スケジュール管理</h1>
        <Suspense fallback={<Button variant="outline" size="sm" disabled>新規登録</Button>}>
          <ScheduleDialogData />
        </Suspense>
      </div>

      <MonthNav currentMonth={currentMonth} />

      <Suspense fallback={<div className="h-10 animate-pulse rounded bg-muted" />}>
        <ScheduleFiltersData />
      </Suspense>

      <ScheduleCalendar
        schedules={items}
        currentMonth={currentMonth}
        hasFilters={hasFilters}
      />
    </div>
  )
}
