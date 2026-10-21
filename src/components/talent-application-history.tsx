import Link from "next/link"
import { CalendarDays, MapPin, Briefcase, Check, X, ChevronRight } from "lucide-react"
import { APPLICATION_TONE, StatusChip } from "@/components/admin/status-chip"
import { BTN_SECONDARY } from "@/components/talent/styles"

// 札の色は管理画面の応募管理と同じ（応募中＝青・書類送付済＝黄・合格＝緑・不合格＝赤）
const statusConfig: Record<string, { label: string }> = {
  APPLIED: { label: "応募済み" },
  RESUME_SENT: { label: "書類送付済" },
  ACCEPTED: { label: "合格" },
  REJECTED: { label: "不合格" },
  CANCELLED: { label: "キャンセル" },
  AUTO_REJECTED: { label: "自動不合格" },
}

const ACTIVE_STATUSES = new Set(["APPLIED", "RESUME_SENT", "ACCEPTED"])

const TIMELINE_STEPS = [
  { status: "APPLIED", label: "応募" },
  { status: "RESUME_SENT", label: "書類送付" },
  { status: "ACCEPTED", label: "合格" },
] as const

const STATUS_ORDER: Record<string, number> = {
  APPLIED: 0,
  RESUME_SENT: 1,
  ACCEPTED: 2,
}

type Schedule = {
  date: Date
  startTime: string | null
  endTime: string | null
  location: string | null
  status: string
}

type Application = {
  id: string
  status: string
  appliedAt: Date
  job: {
    id: string
    title: string
    location: string | null
  }
  schedule: Schedule | null
}

function ApplicationTimeline({ status }: { status: string }) {
  const isRejected = status === "REJECTED" || status === "AUTO_REJECTED"
  const isCancelled = status === "CANCELLED"
  const currentIdx = STATUS_ORDER[status] ?? -1

  if (isCancelled) return null

  return (
    <ol className="mt-4 flex items-start" aria-label="選考の進み具合">
      {TIMELINE_STEPS.map((step, idx) => {
        const isCompleted = currentIdx >= idx
        const isLast = idx === TIMELINE_STEPS.length - 1
        const showRejected = isRejected && idx === currentIdx + 1

        return (
          <li key={step.status} className="flex flex-1 items-start last:flex-none">
            <div className="flex w-12 flex-col items-center">
              <div
                className={`flex size-6 items-center justify-center rounded-full ${
                  showRejected
                    ? "bg-red-600 text-white"
                    : isCompleted
                    ? "bg-neutral-950 text-white"
                    : "border border-neutral-300 bg-white"
                }`}
              >
                {showRejected ? (
                  <X className="size-3.5" aria-hidden="true" />
                ) : isCompleted ? (
                  <Check className="size-3.5" aria-hidden="true" />
                ) : null}
              </div>
              <span
                className={`mt-1.5 text-[11px] ${
                  showRejected
                    ? "font-medium text-red-600"
                    : isCompleted
                    ? "font-medium text-neutral-950"
                    : "text-neutral-400"
                }`}
              >
                {showRejected ? "不合格" : step.label}
              </span>
            </div>
            {!isLast && (
              <div
                className={`mt-3 h-px flex-1 ${
                  currentIdx > idx ? "bg-neutral-950" : "bg-neutral-200"
                }`}
              />
            )}
          </li>
        )
      })}
    </ol>
  )
}

function ApplicationCard({ app }: { app: Application }) {
  const s = statusConfig[app.status] ?? { label: app.status }
  const schedule = app.schedule
  const jobLocation = schedule?.location || app.job.location
  const showTimeline = ACTIVE_STATUSES.has(app.status) || app.status === "REJECTED" || app.status === "AUTO_REJECTED"

  return (
    <li className="relative rounded-xl border border-neutral-200 bg-white p-4 transition-colors hover:border-neutral-300 hover:bg-neutral-50/60 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        {/* カード全体を押せるようにする（行き先はタイトルのリンクと同じ） */}
        <Link
          href={`/jobs/${app.job.id}`}
          className="line-clamp-2 text-[15px] font-medium leading-snug text-neutral-950 after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-neutral-950/30"
        >
          {app.job.title}
        </Link>
        <div className="flex shrink-0 items-center gap-1">
          <StatusChip tone={APPLICATION_TONE[app.status] ?? "gray"} label={s.label} />
          <ChevronRight className="size-4 text-neutral-400" aria-hidden="true" />
        </div>
      </div>

      {showTimeline && <ApplicationTimeline status={app.status} />}

      {app.status === "ACCEPTED" && schedule && (
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 rounded-lg bg-neutral-50 px-3 py-2.5 text-sm text-neutral-700">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="size-4 text-neutral-500" aria-hidden="true" />
            {new Date(schedule.date).toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" })}
            {schedule.startTime && (
              <> {schedule.startTime}{schedule.endTime && `〜${schedule.endTime}`}</>
            )}
          </span>
          {jobLocation && (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-4 text-neutral-500" aria-hidden="true" />
              {jobLocation}
            </span>
          )}
        </div>
      )}

      <p className="mt-3 text-xs tabular-nums text-neutral-500">
        応募日: {new Date(app.appliedAt).toLocaleDateString("ja-JP")}
      </p>
    </li>
  )
}

export function TalentApplicationHistory({ applications }: { applications: Application[] }) {
  if (applications.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-xl border border-dashed border-neutral-300 px-4 py-10 text-center">
        <div className="flex size-11 items-center justify-center rounded-full bg-neutral-100">
          <Briefcase className="size-5 text-neutral-500" aria-hidden="true" />
        </div>
        <p className="mt-3 text-sm text-neutral-500">応募履歴はありません</p>
        <Link href="/jobs" className={`${BTN_SECONDARY} mt-5 h-10 text-sm`}>
          案件一覧を見る
          <ChevronRight aria-hidden="true" />
        </Link>
      </div>
    )
  }

  const active = applications.filter((a) => ACTIVE_STATUSES.has(a.status))
  const past = applications.filter((a) => !ACTIVE_STATUSES.has(a.status))

  return (
    <div className="space-y-8">
      {active.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-neutral-500">
            進行中<span className="ml-1.5 tabular-nums text-neutral-400">{active.length}</span>
          </h3>
          <ul className="mt-3 space-y-3">
            {active.map((app) => (
              <ApplicationCard key={app.id} app={app} />
            ))}
          </ul>
        </div>
      )}

      {past.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-neutral-500">
            過去の応募<span className="ml-1.5 tabular-nums text-neutral-400">{past.length}</span>
          </h3>
          <ul className="mt-3 space-y-3">
            {past.map((app) => (
              <ApplicationCard key={app.id} app={app} />
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
