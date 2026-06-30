import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { requireAgencyAdmin } from "@/lib/agency-auth"
import { getAgencyJob, deleteAgencyJob } from "@/lib/actions/agency-job"
import { AgencyJobForm } from "@/components/agency/agency-job-form"
import { StatusBadge } from "@/components/admin/status-badge"
import { APPLICATION_STATUS_LABELS, JOB_STATUS_LABELS } from "@/types"
import { formatDate } from "@/lib/utils/date"
import { ArrowLeft, Trash2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function AgencyJobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const agency = await requireAgencyAdmin()
  const job = await getAgencyJob(id, agency.id)

  if (!job) notFound()

  async function handleDelete() {
    "use server"
    const result = await deleteAgencyJob(id)
    if (result.error) throw new Error(result.error)
    redirect("/agency/jobs")
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/agency/jobs" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-bold">{job.title}</h1>
          <StatusBadge status={job.status} label={JOB_STATUS_LABELS[job.status]} />
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

      <Card>
        <CardHeader>
          <CardTitle>案件情報</CardTitle>
        </CardHeader>
        <CardContent>
          <AgencyJobForm job={job} requirements={job.requirements} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>応募一覧（{job.applications.length}件）</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {job.applications.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">応募がありません</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">タレント名</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">ステータス</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">応募日</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {job.applications.map((app) => (
                  <tr key={app.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">
                      <Link href={`/agency/talents/${app.talent.id}`} className="hover:underline">
                        {app.talent.name}
                      </Link>
                    </td>
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
        </CardContent>
      </Card>
    </div>
  )
}
