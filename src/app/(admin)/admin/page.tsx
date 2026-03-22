import { Suspense } from "react"
import Link from "next/link"
import { prisma } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

async function DashboardStats() {
  const [talentCount, jobCount, applicationCount, openJobs, scheduleCount] =
    await Promise.all([
      prisma.talent.count(),
      prisma.job.count(),
      prisma.application.count(),
      prisma.job.count({ where: { status: "OPEN" } }),
      prisma.schedule.count(),
    ])

  const stats = [
    { label: "タレント", value: talentCount, href: "/admin/talents" },
    { label: "案件（募集中）", value: `${openJobs} / ${jobCount}`, href: "/admin/jobs" },
    { label: "応募", value: applicationCount, href: "/admin/applications" },
    { label: "スケジュール", value: scheduleCount, href: "/admin/schedule" },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Link key={stat.label} href={stat.href}>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl sm:text-3xl font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}

async function RecentApplications() {
  const recentApplications = await prisma.application.findMany({
    take: 5,
    orderBy: { appliedAt: "desc" },
    select: {
      id: true,
      appliedAt: true,
      talent: { select: { name: true } },
      job: { select: { title: true } },
    },
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>最近の応募</CardTitle>
      </CardHeader>
      <CardContent>
        {recentApplications.length === 0 ? (
          <p className="text-muted-foreground text-sm">応募データがありません</p>
        ) : (
          <div className="space-y-3">
            {recentApplications.map((app) => (
              <div
                key={app.id}
                className="flex flex-wrap items-start justify-between gap-1 border-b pb-3 last:border-0"
              >
                <div>
                  <p className="font-medium">{app.talent.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {app.job.title}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {app.appliedAt.toLocaleDateString("ja-JP")}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function StatsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <div className="h-4 w-24 animate-pulse rounded bg-muted" />
          </CardHeader>
          <CardContent>
            <div className="h-8 w-16 animate-pulse rounded bg-muted" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function RecentSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="h-6 w-32 animate-pulse rounded bg-muted" />
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex justify-between border-b pb-3 last:border-0">
            <div className="space-y-2">
              <div className="h-4 w-32 animate-pulse rounded bg-muted" />
              <div className="h-3 w-48 animate-pulse rounded bg-muted" />
            </div>
            <div className="h-3 w-20 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold">ダッシュボード</h1>
      <Suspense fallback={<StatsSkeleton />}>
        <DashboardStats />
      </Suspense>
      <Suspense fallback={<RecentSkeleton />}>
        <RecentApplications />
      </Suspense>
    </div>
  )
}
