import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { getJob } from "@/lib/actions/job"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { JobForm } from "@/components/admin/job-form"
import { DeleteButton } from "@/components/admin/delete-button"
import { StatusBadge } from "@/components/admin/status-badge"
import { APPLICATION_STATUS_LABELS, GENDER_LABELS } from "@/types"
import { formatDate } from "@/lib/utils/date"
import { ApplicationStatusSelect } from "@/components/admin/application-status-select"
import { LineCopyButton } from "@/components/admin/line-copy-button"
import { SubmissionLinks } from "@/components/admin/submission-links"

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const job = await getJob(id)

  if (!job) notFound()

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <Link href="/admin/jobs" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold">{job.title}</h1>
        </div>
        <DeleteButton id={job.id} type="job" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>案件情報</CardTitle>
        </CardHeader>
        <CardContent>
          <JobForm job={job} requirements={job.requirements} />
        </CardContent>
      </Card>

      {job.genderReq || job.ageMin || job.ageMax || job.heightMin || job.heightMax ? (
        <Card>
          <CardHeader>
            <CardTitle>フィルタ条件</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
              {job.genderReq && (
                <div>
                  <span className="text-muted-foreground">性別: </span>
                  {GENDER_LABELS[job.genderReq]}
                </div>
              )}
              {(job.ageMin || job.ageMax) && (
                <div>
                  <span className="text-muted-foreground">年齢: </span>
                  {job.ageMin ?? "−"}〜{job.ageMax ?? "−"}歳
                </div>
              )}
              {(job.heightMin || job.heightMax) && (
                <div>
                  <span className="text-muted-foreground">身長: </span>
                  {job.heightMin ?? "−"}〜{job.heightMax ?? "−"}cm
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>応募一覧（{job.applications.length}件）</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>タレント名</TableHead>
                <TableHead>ステータス</TableHead>
                <TableHead className="hidden sm:table-cell">提出物</TableHead>
                <TableHead className="hidden sm:table-cell">応募日</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {job.applications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    応募がありません
                  </TableCell>
                </TableRow>
              ) : (
                job.applications.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell>
                      <Link
                        href={`/admin/talents/${app.talent.id}`}
                        className="hover:underline"
                      >
                        {app.talent.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        status={app.status}
                        label={APPLICATION_STATUS_LABELS[app.status]}
                      />
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <SubmissionLinks submissions={app.submissions} />
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{formatDate(app.appliedAt)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <LineCopyButton talent={app.talent} />
                        <ApplicationStatusSelect
                          applicationId={app.id}
                          currentStatus={app.status}
                          talentName={app.talent.name}
                          jobTitle={job.title}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
