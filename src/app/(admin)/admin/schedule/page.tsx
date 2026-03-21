import { getSchedules } from "@/lib/actions/schedule"
import { MonthNav } from "@/components/admin/month-nav"
import { NewScheduleDialog } from "@/components/admin/new-schedule-dialog"
import { ScheduleFilters } from "@/components/admin/schedule-filters"
import { ScheduleCalendar } from "@/components/admin/schedule-calendar"
import { prisma } from "@/lib/db"
import type { ScheduleItem } from "@/lib/utils/schedule"

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; talent?: string; job?: string }>
}) {
  const { month, talent, job } = await searchParams
  const currentMonth = month ?? new Date().toISOString().slice(0, 7)

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

  const filterTalents = await prisma.talent.findMany({
    select: { name: true },
    orderBy: { name: "asc" },
  })
  const filterJobs = await prisma.job.findMany({
    select: { title: true },
    orderBy: { title: "asc" },
  })

  const talentOptions = filterTalents.map((t) => ({ value: t.name, label: t.name }))
  const jobOptions = filterJobs.map((j) => ({ value: j.title, label: j.title }))

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
        <NewScheduleDialog applications={acceptedApplications} />
      </div>

      <MonthNav currentMonth={currentMonth} />

      <ScheduleFilters talentOptions={talentOptions} jobOptions={jobOptions} />

      <ScheduleCalendar
        schedules={items}
        currentMonth={currentMonth}
        hasFilters={hasFilters}
      />
    </div>
  )
}
