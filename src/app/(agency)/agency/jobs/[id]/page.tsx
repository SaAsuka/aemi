import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { requireAgencyAdmin } from "@/lib/agency-auth"
import { agencyLogout } from "@/lib/actions/agency-auth"
import { getAgencyJob, deleteAgencyJob } from "@/lib/actions/agency-job"
import { AgencyJobForm } from "@/components/agency/agency-job-form"
import { StatusBadge } from "@/components/admin/status-badge"
import { APPLICATION_STATUS_LABELS, JOB_STATUS_LABELS } from "@/types"
import { formatDate } from "@/lib/utils/date"
import { LogOut, ArrowLeft, Briefcase, LayoutDashboard, Trash2 } from "lucide-react"

export default async function AgencyJobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const agency = await requireAgencyAdmin()
  const job = await getAgencyJob(id, agency.id)

  if (!job) notFound()

  async function handleLogout() {
    "use server"
    await agencyLogout()
    redirect("/agency/login")
  }

  async function handleDelete() {
    "use server"
    const result = await deleteAgencyJob(id)
    if (result.error) throw new Error(result.error)
    redirect("/agency/jobs")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div>
            <h1 className="text-lg font-bold">{agency.name}</h1>
            <p className="text-xs text-muted-foreground">{agency.email}</p>
          </div>
          <nav className="hidden sm:flex items-center gap-4 text-sm">
            <Link href="/agency/dashboard" className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground">
              <LayoutDashboard className="h-4 w-4" />
              ダッシュボード
            </Link>
            <Link href="/agency/jobs" className="flex items-center gap-1.5 font-medium text-foreground">
              <Briefcase className="h-4 w-4" />
              案件管理
            </Link>
          </nav>
        </div>
        <form action={handleLogout}>
          <button type="submit" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <LogOut className="h-4 w-4" />
            ログアウト
          </button>
        </form>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/agency/jobs" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h2 className="text-xl font-bold">{job.title}</h2>
          </div>
          {job._count.applications === 0 && (
            <form action={handleDelete} onSubmit={(e) => { if (!confirm("この案件を削除しますか？")) e.preventDefault() }}>
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-md border border-destructive px-3 py-1.5 text-sm text-destructive hover:bg-destructive/5"
              >
                <Trash2 className="h-4 w-4" />
                削除
              </button>
            </form>
          )}
        </div>

        <div className="rounded-xl border bg-white p-6 space-y-4">
          <h3 className="font-semibold">案件情報</h3>
          <AgencyJobForm job={job} requirements={job.requirements} />
        </div>

        <div className="rounded-xl border bg-white overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h3 className="font-semibold">応募一覧（{job.applications.length}件）</h3>
          </div>
          {job.applications.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">応募がありません</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">タレント名</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">ステータス</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">応募日</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {job.applications.map((app) => (
                  <tr key={app.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{app.talent.name}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={app.status} label={APPLICATION_STATUS_LABELS[app.status]} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                      {formatDate(app.appliedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  )
}
