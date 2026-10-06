import { Suspense } from "react"
import { getSchedules } from "@/lib/actions/schedule"
import { getTalentFilterOptions, getJobFilterOptions } from "@/lib/queries"
import { MonthNav } from "@/components/admin/month-nav"
import { NewScheduleDialog } from "@/components/admin/new-schedule-dialog"
import { ScheduleFilters } from "@/components/admin/schedule-filters"
import { ScheduleCalendar } from "@/components/admin/schedule-calendar"
import { prisma } from "@/lib/db"
import { Plus } from "lucide-react"
import { BTN_PRIMARY, PANEL } from "@/components/admin/styles"
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
  return <NewScheduleDialog applications={acceptedApplications} className={`${BTN_PRIMARY} h-10 w-full sm:h-9 sm:w-auto`} />
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
    <div className="space-y-6 pb-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-neutral-950 sm:text-2xl">スケジュール</h1>
          <p className="mt-1 text-sm text-neutral-500">合格したタレントの撮影などの予定です。予定を押すと、内容の確認と状況の変更ができます。</p>
        </div>
        <Suspense
          fallback={
            <button type="button" disabled className={`${BTN_PRIMARY} h-10 w-full sm:h-9 sm:w-auto`}>
              <Plus aria-hidden="true" />
              予定を登録
            </button>
          }
        >
          <ScheduleDialogData />
        </Suspense>
      </div>

      <div className={`${PANEL} space-y-4 p-4 sm:p-5`}>
        <MonthNav currentMonth={currentMonth} />
        <Suspense fallback={<div className="h-14 animate-pulse rounded-lg bg-neutral-100" />}>
          <ScheduleFiltersData />
        </Suspense>
      </div>

      <ScheduleCalendar
        schedules={items}
        currentMonth={currentMonth}
        hasFilters={hasFilters}
      />
    </div>
  )
}
