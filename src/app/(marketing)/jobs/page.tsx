import { notFound } from "next/navigation"
import Link from "next/link"
import { getTalentByToken } from "@/lib/actions/talent"
import { getOpenJobs } from "@/lib/actions/job"
import { formatDate } from "@/lib/utils/date"
import { GENDER_LABELS } from "@/types"

export default async function TalentJobsPage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string }>
}) {
  const { t } = await searchParams
  if (!t) notFound()

  const talent = await getTalentByToken(t)
  if (!talent || talent.status !== "ACTIVE") notFound()

  const jobs = await getOpenJobs()

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-6">
      <h1 className="text-xl font-bold">{talent.name}さんの案件一覧</h1>

      {jobs.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">現在募集中の案件はありません</p>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <Link
              key={job.id}
              href={`/jobs/${job.id}?t=${t}`}
              className="block rounded-lg border p-4 hover:bg-muted/50 transition-colors"
            >
              <h2 className="font-semibold">{job.title}</h2>
              <p className="text-sm text-muted-foreground mt-1">{job.client.companyName}</p>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                {job.location && <span>{job.location}</span>}
                {job.fee != null && <span>報酬: ¥{job.fee.toLocaleString()}</span>}
                {job.genderReq && <span>{GENDER_LABELS[job.genderReq]}</span>}
                {job.deadline && <span>締切: {formatDate(job.deadline)}</span>}
              </div>
              {(job.startsAt || job.endsAt) && (
                <p className="text-sm text-muted-foreground mt-1">
                  期間: {job.startsAt ? formatDate(job.startsAt) : "−"} 〜 {job.endsAt ? formatDate(job.endsAt) : "−"}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
