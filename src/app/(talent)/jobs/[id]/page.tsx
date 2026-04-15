import { redirect } from "next/navigation"
import Link from "next/link"
import { requireTalent } from "@/lib/auth"
import { getTalentByToken } from "@/lib/actions/talent"
import { getOpenJob } from "@/lib/actions/job"
import { prisma } from "@/lib/db"
import { formatDate, formatDeadline } from "@/lib/utils/date"
import { GENDER_LABELS } from "@/types"
import { JobApplicationForm } from "@/components/job-application-form"
import { TalentNav } from "@/components/talent-nav"

export default async function TalentJobDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ t?: string }>
}) {
  const [{ id }, { t }] = await Promise.all([params, searchParams])

  let talent: { id: string; name: string; status: string }

  if (t) {
    const tokenTalent = await getTalentByToken(t)
    if (!tokenTalent || tokenTalent.status !== "ACTIVE") redirect("/auth/login")
    talent = tokenTalent
  } else {
    const sessionTalent = await requireTalent()
    talent = sessionTalent
  }

  const displayName = talent.name
  const [job, talentResume, activeApps] = await Promise.all([
    getOpenJob(id),
    prisma.talent.findUnique({ where: { id: talent.id }, select: { resume: true } }),
    prisma.application.findMany({
      where: {
        talentId: talent.id,
        status: { in: ["APPLIED", "RESUME_SENT", "ACCEPTED"] },
      },
      select: {
        job: { select: { title: true, dates: { select: { date: true, type: true } } } },
      },
    }),
  ])
  const hasResume = !!talentResume?.resume
  if (!job) redirect("/jobs")

  const typeLabels: Record<string, string> = { AUDITION: "オーディション", SHOOTING: "撮影", OTHER: "予定" }
  let dateConflict: string | null = null
  if (job.dates.length > 0) {
    const jobDateStrings = new Set(job.dates.map((d) => d.date.toISOString().split("T")[0]))
    for (const app of activeApps) {
      for (const d of app.job.dates) {
        const dateStr = d.date.toISOString().split("T")[0]
        if (jobDateStrings.has(dateStr)) {
          const dt = new Date(dateStr)
          dateConflict = `${dt.getMonth() + 1}月${dt.getDate()}日に別の案件（${app.job.title}）の${typeLabels[d.type] ?? "予定"}があります`
          break
        }
      }
      if (dateConflict) break
    }
  }

  const backHref = t ? `/jobs?t=${t}` : "/jobs"

  return (
    <>
      {!t && <TalentNav talentName={displayName} />}
    <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">
      <Link href={backHref} className="text-sm text-muted-foreground hover:underline">
        &larr; 案件一覧に戻る
      </Link>

      <div>
        <h1 className="text-xl font-bold">{job.title}</h1>
        <p className="text-sm text-muted-foreground mt-1">{job.client.companyName}</p>
      </div>

      <div className="rounded-lg border p-4 space-y-3 text-sm">
        {job.location && (
          <div>
            <span className="text-muted-foreground">場所: </span>{job.location}
          </div>
        )}
        {job.fee != null && (
          <div>
            <span className="text-muted-foreground">報酬: </span>&yen;{job.fee.toLocaleString()}
          </div>
        )}
        {job.dates.length > 0 && (
          <div className="space-y-1">
            {job.dates.map((d, i) => (
              <div key={i}>
                <span className="text-muted-foreground">
                  {d.type === "AUDITION" ? "オーディション" : d.type === "SHOOTING" ? "撮影" : "日程"}:{" "}
                </span>
                {formatDate(d.date)}
                {d.startTime && ` ${d.startTime}`}
                {d.location && ` (${d.location})`}
              </div>
            ))}
          </div>
        )}
        {job.deadline && (
          <div>
            <span className="text-muted-foreground">締切: </span>{formatDeadline(job.deadline)}
          </div>
        )}
        {job.capacity != null && (
          <div>
            <span className="text-muted-foreground">募集人数: </span>{job.capacity}名
          </div>
        )}
        {job.genderReq && (
          <div>
            <span className="text-muted-foreground">性別条件: </span>{GENDER_LABELS[job.genderReq]}
          </div>
        )}
        {(job.ageMin != null || job.ageMax != null) && (
          <div>
            <span className="text-muted-foreground">年齢条件: </span>
            {job.ageMin ?? "−"}〜{job.ageMax ?? "−"}歳
          </div>
        )}
        {(job.heightMin != null || job.heightMax != null) && (
          <div>
            <span className="text-muted-foreground">身長条件: </span>
            {job.heightMin ?? "−"}〜{job.heightMax ?? "−"}cm
          </div>
        )}
      </div>

      {job.description && (
        <div className="text-sm">
          <p className="text-muted-foreground mb-1">詳細</p>
          <p className="whitespace-pre-wrap">{job.description}</p>
        </div>
      )}

      <JobApplicationForm jobId={job.id} talentId={talent.id} talentName={talent.name} requirements={job.requirements} hasResume={hasResume} dateConflict={dateConflict} />
    </div>
    </>
  )
}
