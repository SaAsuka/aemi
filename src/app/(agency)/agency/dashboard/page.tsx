import { requireAgencyAdmin } from "@/lib/agency-auth"
import { prisma } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Users, Briefcase, FileText, ShoppingBag } from "lucide-react"

export default async function AgencyDashboardPage() {
  const agency = await requireAgencyAdmin()

  const [talentCount, jobCount, applicationCount, optionCount, recentApplications] = await Promise.all([
    prisma.talent.count({ where: { agencyId: agency.id } }),
    prisma.job.count({ where: { agencyId: agency.id } }),
    prisma.application.count({ where: { job: { agencyId: agency.id } } }),
    prisma.option.count({ where: { agencyId: agency.id } }),
    prisma.application.findMany({
      where: { job: { agencyId: agency.id } },
      orderBy: { appliedAt: "desc" },
      take: 5,
      select: {
        id: true,
        status: true,
        appliedAt: true,
        talent: { select: { name: true } },
        job: { select: { id: true, title: true } },
      },
    }),
  ])

  const stats = [
    { label: "タレント", value: talentCount, href: "/agency/talents", icon: Users, color: "text-blue-600" },
    { label: "案件", value: jobCount, href: "/agency/jobs", icon: Briefcase, color: "text-green-600" },
    { label: "応募", value: applicationCount, href: "/agency/applications", icon: FileText, color: "text-orange-600" },
    { label: "オプション", value: optionCount, href: "/agency/options", icon: ShoppingBag, color: "text-purple-600" },
  ]

  const statusLabels: Record<string, string> = {
    APPLIED: "応募済み",
    RESUME_SENT: "書類送付済",
    ACCEPTED: "合格",
    REJECTED: "不合格",
    AUTO_REJECTED: "自動不合格",
    CANCELLED: "キャンセル",
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold">ダッシュボード</h1>
        <p className="text-sm text-muted-foreground mt-1">{agency.name}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.href} href={stat.href}>
            <Card className="hover:bg-muted/40 transition-colors cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <stat.icon className={`h-8 w-8 ${stat.color} opacity-80`} />
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">最近の応募</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {recentApplications.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">応募がありません</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">タレント</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">案件</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">ステータス</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">応募日</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {recentApplications.map((app) => (
                  <tr key={app.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">{app.talent.name}</td>
                    <td className="px-4 py-3">
                      <Link href={`/agency/jobs/${app.job.id}`} className="hover:underline">
                        {app.job.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {statusLabels[app.status] ?? app.status}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                      {new Date(app.appliedAt).toLocaleDateString("ja-JP")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
