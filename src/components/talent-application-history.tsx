import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, MapPin, Briefcase, Check, X, Circle } from "lucide-react"

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; color: string }> = {
  APPLIED: { label: "応募済み", variant: "default", color: "border-l-blue-400" },
  RESUME_SENT: { label: "書類送付済", variant: "secondary", color: "border-l-yellow-400" },
  ACCEPTED: { label: "合格", variant: "default", color: "border-l-green-500" },
  REJECTED: { label: "不合格", variant: "destructive", color: "border-l-red-400" },
  CANCELLED: { label: "キャンセル", variant: "outline", color: "border-l-gray-400" },
  AUTO_REJECTED: { label: "自動不合格", variant: "destructive", color: "border-l-red-400" },
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
    <div className="flex items-center gap-0 mt-3">
      {TIMELINE_STEPS.map((step, idx) => {
        const isCompleted = currentIdx >= idx
        const isCurrent = currentIdx === idx
        const isLast = idx === TIMELINE_STEPS.length - 1
        const showRejected = isRejected && idx === currentIdx + 1

        return (
          <div key={step.status} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={`h-6 w-6 rounded-full flex items-center justify-center text-xs ${
                  showRejected
                    ? "bg-red-100 text-red-600 border-2 border-red-400"
                    : isCompleted
                    ? "bg-primary text-primary-foreground"
                    : isCurrent
                    ? "bg-primary/20 text-primary border-2 border-primary"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {showRejected ? (
                  <X className="h-3 w-3" />
                ) : isCompleted ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <Circle className="h-3 w-3" />
                )}
              </div>
              <span
                className={`text-[10px] mt-1 ${
                  showRejected
                    ? "text-red-600 font-medium"
                    : isCompleted
                    ? "text-foreground font-medium"
                    : "text-muted-foreground"
                }`}
              >
                {showRejected ? "不合格" : step.label}
              </span>
            </div>
            {!isLast && (
              <div
                className={`h-0.5 flex-1 mx-1 ${
                  currentIdx > idx ? "bg-primary" : "bg-muted"
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

function ApplicationCard({ app }: { app: Application }) {
  const s = statusConfig[app.status] ?? { label: app.status, variant: "outline" as const, color: "border-l-gray-400" }
  const schedule = app.schedule
  const jobLocation = schedule?.location || app.job.location
  const showTimeline = ACTIVE_STATUSES.has(app.status) || app.status === "REJECTED" || app.status === "AUTO_REJECTED"

  return (
    <div className={`border rounded-lg p-4 border-l-4 ${s.color}`}>
      <div className="flex items-center justify-between">
        <Link href={`/jobs/${app.job.id}`} className="text-sm font-medium hover:underline line-clamp-1">
          {app.job.title}
        </Link>
        <Badge variant={s.variant} className="ml-2 shrink-0">{s.label}</Badge>
      </div>

      {showTimeline && <ApplicationTimeline status={app.status} />}

      {app.status === "ACCEPTED" && schedule && (
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="h-4 w-4" />
            {new Date(schedule.date).toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" })}
            {schedule.startTime && (
              <> {schedule.startTime}{schedule.endTime && `〜${schedule.endTime}`}</>
            )}
          </span>
          {jobLocation && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {jobLocation}
            </span>
          )}
        </div>
      )}

      <p className="text-xs text-muted-foreground mt-1.5">
        応募日: {new Date(app.appliedAt).toLocaleDateString("ja-JP")}
      </p>
    </div>
  )
}

export function TalentApplicationHistory({ applications }: { applications: Application[] }) {
  if (applications.length === 0) {
    return (
      <div className="text-center py-8 space-y-3">
        <Briefcase className="h-10 w-10 text-muted-foreground/40 mx-auto" />
        <p className="text-sm text-muted-foreground">応募履歴はありません</p>
        <Link href="/jobs" className="text-sm text-primary hover:underline">
          案件一覧を見る →
        </Link>
      </div>
    )
  }

  const active = applications.filter((a) => ACTIVE_STATUSES.has(a.status))
  const past = applications.filter((a) => !ACTIVE_STATUSES.has(a.status))

  return (
    <div className="space-y-6">
      {active.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">進行中</h3>
          {active.map((app) => (
            <ApplicationCard key={app.id} app={app} />
          ))}
        </div>
      )}

      {past.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">過去の応募</h3>
          {past.map((app) => (
            <ApplicationCard key={app.id} app={app} />
          ))}
        </div>
      )}
    </div>
  )
}
