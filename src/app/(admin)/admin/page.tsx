import Link from "next/link"
import { prisma } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function AdminDashboard() {
  const [talentCount, clientCount, jobCount, applicationCount] =
    await Promise.all([
      prisma.talent.count(),
      prisma.client.count(),
      prisma.job.count(),
      prisma.application.count(),
    ])

  const recentApplications = await prisma.application.findMany({
    take: 5,
    orderBy: { appliedAt: "desc" },
    select: {
      id: true,
      appliedAt: true,
      talent: { select: { name: true } },
      job: {
        select: {
          title: true,
          client: { select: { companyName: true } },
        },
      },
    },
  })

  const openJobs = await prisma.job.count({ where: { status: "OPEN" } })

  const stats = [
    { label: "タレント", value: talentCount, href: "/admin/talents" },
    { label: "クライアント", value: clientCount, href: "/admin/clients" },
    { label: "案件（募集中）", value: `${openJobs} / ${jobCount}`, href: "/admin/jobs" },
    { label: "応募", value: applicationCount, href: "/admin/applications" },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold">ダッシュボード</h1>

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
                      {app.job.title} ({app.job.client.companyName})
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
    </div>
  )
}
