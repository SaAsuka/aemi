import Link from "next/link"
import { requireAgencyAdmin } from "@/lib/agency-auth"
import { agencyLogout } from "@/lib/actions/agency-auth"
import { getAgencyJobs } from "@/lib/actions/agency-job"
import { redirect } from "next/navigation"
import { StatusBadge } from "@/components/admin/status-badge"
import { JOB_STATUS_LABELS } from "@/types"
import { formatDeadline } from "@/lib/utils/date"
import { LogOut, Plus, Briefcase, LayoutDashboard } from "lucide-react"

export default async function AgencyJobsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>
}) {
  const agency = await requireAgencyAdmin()
  const { q, status } = await searchParams
  const jobs = await getAgencyJobs(agency.id, q, status)

  async function handleLogout() {
    "use server"
    await agencyLogout()
    redirect("/agency/login")
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

      <main className="mx-auto max-w-5xl px-6 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">案件管理</h2>
          <Link
            href="/agency/jobs/new"
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            新規作成
          </Link>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <form method="GET" className="flex gap-2">
            <input
              name="q"
              defaultValue={q}
              placeholder="案件名で検索"
              className="h-9 rounded-md border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring w-48"
            />
            {status && <input type="hidden" name="status" value={status} />}
            <button type="submit" className="h-9 rounded-md border bg-white px-3 text-sm hover:bg-gray-50">検索</button>
          </form>
          <div className="flex gap-1">
            {[
              { value: undefined, label: "すべて" },
              { value: "DRAFT", label: "下書き" },
              { value: "OPEN", label: "募集中" },
              { value: "CLOSED", label: "募集終了" },
              { value: "CANCELLED", label: "キャンセル" },
            ].map((opt) => (
              <Link
                key={opt.label}
                href={opt.value ? `/agency/jobs?status=${opt.value}${q ? `&q=${q}` : ""}` : `/agency/jobs${q ? `?q=${q}` : ""}`}
                className={`h-9 rounded-md px-3 text-sm flex items-center ${
                  (opt.value ?? "") === (status ?? "")
                    ? "bg-primary text-primary-foreground"
                    : "border bg-white hover:bg-gray-50"
                }`}
              >
                {opt.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-xl border bg-white overflow-hidden">
          {jobs.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              <Briefcase className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">案件がありません</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">案件名</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">締切</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">応募</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">ステータス</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">
                      <Link href={`/agency/jobs/${job.id}`} className="hover:underline">
                        {job.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                      {job.deadline ? formatDeadline(job.deadline) : "−"}
                    </td>
                    <td className="px-4 py-3">{job._count.applications}名</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={job.status} label={JOB_STATUS_LABELS[job.status]} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/agency/jobs/${job.id}`}
                        className="rounded-md border px-2.5 py-1 text-xs hover:bg-gray-50"
                      >
                        詳細
                      </Link>
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
