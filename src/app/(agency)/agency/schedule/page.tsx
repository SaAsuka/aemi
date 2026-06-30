import { Suspense } from "react"
import { requireAgencyAdmin } from "@/lib/agency-auth"
import { getAgencySchedules } from "@/lib/actions/agency-schedule"
import { getAgencyTalentFilterOptions, getAgencyJobFilterOptions } from "@/lib/agency-queries"
import { MonthNav } from "@/components/admin/month-nav"
import { ScheduleCalendar } from "@/components/admin/schedule-calendar"
import { ScheduleFilters } from "@/components/admin/schedule-filters"
import { prisma } from "@/lib/db"
import { Button } from "@/components/ui/button"
import type { ScheduleItem } from "@/lib/utils/schedule"
import { AgencyNewScheduleDialog } from "@/components/agency/agency-new-schedule-dialog"

async function AgencyScheduleDialogData({ agencyId }: { agencyId: string }) {
  const acceptedApplications = await prisma.application.findMany({
    where: {
      status: "ACCEPTED",
      schedule: null,
      job: { agencyId },
    },
    select: {
      id: true,
      status: true,
      talent: { select: { id: true, name: true } },
      job: { select: { id: true, title: true } },
    },
    orderBy: { appliedAt: "desc" },
  })
  return <AgencyNewScheduleDialog applications={acceptedApplications} />
}

async function AgencyScheduleFiltersData({ agencyId }: { agencyId: string }) {
  const [talentOptions, jobOptions] = await Promise.all([
    getAgencyTalentFilterOptions(agencyId),
    getAgencyJobFilterOptions(agencyId),
  ])
  return <ScheduleFilters talentOptions={talentOptions} jobOptions={jobOptions} />
}

export default async function AgencySchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; talent?: string; job?: string }>
}) {
  const agency = await requireAgencyAdmin()
  const { month, talent, job } = await searchParams
  const currentMonth = month ?? new Date().toISOString().slice(0, 7)
  const hasFilters = !!(talent || job)

  const schedules = await getAgencySchedules(agency.id, { month: currentMonth, talent, job })

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
          <AgencyScheduleDialogData agencyId={agency.id} />
        </Suspense>
      </div>

      <MonthNav currentMonth={currentMonth} />

      <Suspense>
        <AgencyScheduleFiltersData agencyId={agency.id} />
      </Suspense>

      <ScheduleCalendar
        schedules={items}
        currentMonth={currentMonth}
        hasFilters={hasFilters}
      />
    </div>
  )
}
