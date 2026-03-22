import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, MapPin, Briefcase } from "lucide-react"

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; color: string }> = {
  APPLIED: { label: "応募済み", variant: "default", color: "border-l-blue-400" },
  RESUME_SENT: { label: "書類送付済", variant: "secondary", color: "border-l-yellow-400" },
  ACCEPTED: { label: "合格", variant: "default", color: "border-l-green-500" },
  REJECTED: { label: "不合格", variant: "destructive", color: "border-l-red-400" },
  CANCELLED: { label: "キャンセル", variant: "outline", color: "border-l-gray-400" },
  AUTO_REJECTED: { label: "自動不合格", variant: "destructive", color: "border-l-red-400" },
}

const ACTIVE_STATUSES = new Set(["APPLIED", "RESUME_SENT", "ACCEPTED"])

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
    startsAt: Date | null
  }
  schedule: Schedule | null
}

function ApplicationCard({ app }: { app: Application }) {
  const s = statusConfig[app.status] ?? { label: app.status, variant: "outline" as const, color: "border-l-gray-400" }
  const schedule = app.schedule
  const jobLocation = schedule?.location || app.job.location

  return (
    <div className={`border rounded-lg p-3 border-l-4 ${s.color}`}>
      <div className="flex items-center justify-between">
        <Link href={`/jobs/${app.job.id}`} className="text-sm font-medium hover:underline line-clamp-1">
          {app.job.title}
        </Link>
        <Badge variant={s.variant} className="ml-2 shrink-0">{s.label}</Badge>
      </div>

      {app.status === "ACCEPTED" && schedule && (
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="h-3.5 w-3.5" />
            {new Date(schedule.date).toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" })}
            {schedule.startTime && (
              <> {schedule.startTime}{schedule.endTime && `〜${schedule.endTime}`}</>
            )}
          </span>
          {jobLocation && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
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
