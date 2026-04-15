import { Suspense } from "react"
import Link from "next/link"
import { prisma } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MonthlyApplicationChart } from "@/components/admin/monthly-application-chart"
import { MonthlyJobChart } from "@/components/admin/monthly-job-chart"
import { MonthlyAcceptRateChart } from "@/components/admin/monthly-accept-rate-chart"

function getJstNow() {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Tokyo" }))
}

function getMonthRange(year: number, month: number) {
  const start = new Date(`${year}-${String(month).padStart(2, "0")}-01T00:00:00+09:00`)
  const nextMonth = month === 12 ? 1 : month + 1
  const nextYear = month === 12 ? year + 1 : year
  const end = new Date(`${nextYear}-${String(nextMonth).padStart(2, "0")}-01T00:00:00+09:00`)
  return { start, end }
}

async function DashboardStats() {
  const jstNow = getJstNow()
  const { start: monthStart, end: monthEnd } = getMonthRange(jstNow.getFullYear(), jstNow.getMonth() + 1)

  const [talentCount, jobCount, applicationCount, openJobs, monthlyAccepted] =
    await Promise.all([
      prisma.talent.count(),
      prisma.job.count(),
      prisma.application.count(),
      prisma.job.count({ where: { status: "OPEN" } }),
      prisma.application.count({
        where: {
          status: "ACCEPTED",
          decidedAt: { gte: monthStart, lt: monthEnd },
        },
      }),
    ])

  const stats = [
    { label: "タレント", value: talentCount, href: "/admin/talents" },
    { label: "案件（募集中）", value: `${openJobs} / ${jobCount}`, href: "/admin/jobs" },
    { label: "応募", value: applicationCount, href: "/admin/applications" },
    { label: "今月の合格", value: monthlyAccepted, href: "/admin/applications?status=ACCEPTED" },
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

async function MonthlyCharts() {
  const jstNow = getJstNow()
  const months: { year: number; month: number; label: string; start: Date; end: Date }[] = []

  for (let i = 5; i >= 0; i--) {
    const d = new Date(jstNow.getFullYear(), jstNow.getMonth() - i, 1)
    const y = d.getFullYear()
    const m = d.getMonth() + 1
    const { start, end } = getMonthRange(y, m)
    months.push({ year: y, month: m, label: `${m}月`, start, end })
  }

  const [applicationsByMonth, jobsByMonth, acceptedByMonth, totalByMonth] = await Promise.all([
    Promise.all(
      months.map(async (m) => {
        const [applied, resumeSent, accepted, rejected] = await Promise.all([
          prisma.application.count({ where: { appliedAt: { gte: m.start, lt: m.end }, status: "APPLIED" } }),
          prisma.application.count({ where: { appliedAt: { gte: m.start, lt: m.end }, status: "RESUME_SENT" } }),
          prisma.application.count({ where: { appliedAt: { gte: m.start, lt: m.end }, status: "ACCEPTED" } }),
          prisma.application.count({ where: { appliedAt: { gte: m.start, lt: m.end }, status: { in: ["REJECTED", "AUTO_REJECTED"] } } }),
        ])
        return { label: m.label, 応募中: applied, 書類送付済: resumeSent, 合格: accepted, 不合格: rejected }
      })
    ),
    Promise.all(
      months.map(async (m) => {
        const count = await prisma.job.count({ where: { createdAt: { gte: m.start, lt: m.end } } })
        return { label: m.label, 案件数: count }
      })
    ),
    Promise.all(
      months.map(async (m) => {
        const accepted = await prisma.application.count({ where: { decidedAt: { gte: m.start, lt: m.end }, status: "ACCEPTED" } })
        const decided = await prisma.application.count({ where: { decidedAt: { gte: m.start, lt: m.end }, status: { in: ["ACCEPTED", "REJECTED", "AUTO_REJECTED"] } } })
        return { label: m.label, 合格率: decided > 0 ? Math.round((accepted / decided) * 100) : 0 }
      })
    ),
    Promise.all(
      months.map(async (m) => {
        const count = await prisma.application.count({ where: { appliedAt: { gte: m.start, lt: m.end } } })
        return { label: m.label, total: count }
      })
    ),
  ])

  const applicationData = applicationsByMonth.map((d, i) => ({
    ...d,
    合計: totalByMonth[i].total,
  }))

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">月別応募推移</CardTitle>
        </CardHeader>
        <CardContent>
          <MonthlyApplicationChart data={applicationData} />
        </CardContent>
      </Card>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">月別新規案件数</CardTitle>
          </CardHeader>
          <CardContent>
            <MonthlyJobChart data={jobsByMonth} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">月別合格率</CardTitle>
          </CardHeader>
          <CardContent>
            <MonthlyAcceptRateChart data={acceptedByMonth} />
          </CardContent>
        </Card>
      </div>
    </>
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
        <CardTitle className="text-sm font-medium">最近の応募</CardTitle>
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
                  <p className="font-medium text-sm">{app.talent.name}</p>
                  <p className="text-xs text-muted-foreground">
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

async function PendingActions() {
  const now = new Date()
  const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)

  const [appliedCount, deadlineSoonCount, resumeSentCount] = await Promise.all([
    prisma.application.count({ where: { status: "APPLIED" } }),
    prisma.job.count({
      where: {
        status: "OPEN",
        deadline: { lte: threeDaysLater },
      },
    }),
    prisma.application.count({ where: { status: "RESUME_SENT" } }),
  ])

  const items = [
    {
      label: "未確認の応募",
      count: appliedCount,
      href: "/admin/applications?status=APPLIED",
    },
    {
      label: "締切3日以内の案件",
      count: deadlineSoonCount,
      href: "/admin/jobs?status=OPEN",
    },
    {
      label: "書類送付待ち",
      count: resumeSentCount,
      href: "/admin/applications?status=RESUME_SENT",
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {items.map((item) => (
        <Link key={item.label} href={item.href}>
          <Card
            className={`transition-shadow hover:shadow-md ${
              item.count > 0
                ? "border-amber-400 bg-amber-50 dark:border-amber-600 dark:bg-amber-950"
                : "opacity-50"
            }`}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {item.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p
                className={`text-2xl font-bold ${
                  item.count > 0
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-muted-foreground"
                }`}
              >
                {item.count}件
              </p>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
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

function PendingSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <div className="h-4 w-28 animate-pulse rounded bg-muted" />
          </CardHeader>
          <CardContent>
            <div className="h-8 w-12 animate-pulse rounded bg-muted" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function ChartSkeleton() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><div className="h-4 w-32 animate-pulse rounded bg-muted" /></CardHeader>
        <CardContent><div className="h-[250px] animate-pulse rounded bg-muted" /></CardContent>
      </Card>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader><div className="h-4 w-32 animate-pulse rounded bg-muted" /></CardHeader>
          <CardContent><div className="h-[200px] animate-pulse rounded bg-muted" /></CardContent>
        </Card>
        <Card>
          <CardHeader><div className="h-4 w-32 animate-pulse rounded bg-muted" /></CardHeader>
          <CardContent><div className="h-[200px] animate-pulse rounded bg-muted" /></CardContent>
        </Card>
      </div>
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
      <Suspense fallback={<PendingSkeleton />}>
        <PendingActions />
      </Suspense>
      <Suspense fallback={<ChartSkeleton />}>
        <MonthlyCharts />
      </Suspense>
      <Suspense fallback={<RecentSkeleton />}>
        <RecentApplications />
      </Suspense>
    </div>
  )
}
