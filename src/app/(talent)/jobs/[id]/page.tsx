import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { requireTalent } from "@/lib/auth"
import { getTalentByToken } from "@/lib/actions/talent"
import { getOpenJob } from "@/lib/actions/job"
import { prisma } from "@/lib/db"
import { formatDate, formatDeadline } from "@/lib/utils/date"
import { GENDER_LABELS } from "@/types"
import { JobApplicationForm } from "@/components/job-application-form"
import { isAgeLocked, parseSubmissionFields, profileInitialValue, visibleFields } from "@/lib/submission-fields"
import { TalentNav } from "@/components/talent-nav"
import { BackToJobsLink } from "@/components/back-to-jobs-link"
import { Info } from "lucide-react"

export const metadata: Metadata = {
  title: "案件詳細 | VOZEL",
}

// 案件の情報を「見出し｜内容」の行で並べる
function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-3 py-3 first:pt-0 last:pb-0 sm:grid-cols-[8rem_minmax(0,1fr)]">
      <dt className="text-neutral-500">{label}</dt>
      <dd className="text-neutral-950">{children}</dd>
    </div>
  )
}

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
  const [openJob, talentResume, activeApps, myApplication] = await Promise.all([
    getOpenJob(id),
    prisma.talent.findUnique({ where: { id: talent.id }, select: { resume: true, name: true, birthDate: true, height: true } }),
    prisma.application.findMany({
      where: {
        talentId: talent.id,
        status: { in: ["APPLIED", "RESUME_SENT", "ACCEPTED"] },
      },
      select: {
        job: { select: { title: true, dates: { select: { date: true, type: true } } } },
      },
    }),
    prisma.application.findUnique({ where: { talentId_jobId: { talentId: talent.id, jobId: id } }, select: { id: true } }),
  ])
  const hasResume = !!talentResume?.resume

  // 募集が終わった（締切切れ・募集終了・中止）案件でも、応募した本人には内容を見せる
  // （マイページの応募状況から開けるように）。応募フォームは出さない
  const closedJob =
    openJob || !myApplication
      ? null
      : await prisma.job.findUnique({
          where: { id },
          select: {
            id: true, title: true, description: true, location: true, fee: true,
            genderReq: true, ageMin: true, ageMax: true, heightMin: true, heightMax: true,
            deadline: true, capacity: true, status: true,
            client: { select: { companyName: true } },
            dates: { orderBy: { date: "asc" as const } },
          },
        })
  const job = openJob ?? closedJob
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

  // 自由な提出項目（コンポジの項目はフォームに出さない）
  const fields = openJob ? visibleFields(parseSubmissionFields(openJob.submissionFields)) : []
  // 名前・年齢・身長はプロフィールの値を最初から入れる（プロフィールは書き換えない）。年齢はここで1回だけ計算する
  const profile = { name: talentResume?.name ?? null, birthDate: talentResume?.birthDate ?? null, height: talentResume?.height ?? null }
  const today = new Date()
  const prefill = Object.fromEntries(
    fields
      .filter((f) => f.autofill === "NAME" || f.autofill === "AGE" || f.autofill === "HEIGHT")
      .map((f) => [f.key, { value: profileInitialValue(f.autofill, profile, today), locked: isAgeLocked(f, profile) }])
  )

  const backHref = t ? `/jobs?t=${t}` : "/jobs"

  const hasConditions = !!job.genderReq || job.ageMin != null || job.ageMax != null || job.heightMin != null || job.heightMax != null

  return (
    <div className="min-h-[100dvh] bg-white">
      {!t && <TalentNav talentName={displayName} />}
      <main className="mx-auto max-w-3xl space-y-6 px-4 pt-6 text-neutral-950 sm:pt-8">
        <BackToJobsLink fallbackHref={backHref} />

        <div>
          <h1 className="text-2xl font-semibold leading-snug tracking-tight">{job.title}</h1>
          <p className="mt-1.5 text-sm text-neutral-500">{job.client.companyName}</p>
        </div>

        <section className="rounded-xl border border-neutral-200 p-5 sm:p-6">
          <h2 className="sr-only">案件の情報</h2>
          <dl className="divide-y divide-neutral-100 text-sm">
            {job.location && <InfoRow label="場所">{job.location}</InfoRow>}
            {job.fee != null && (
              <InfoRow label="報酬">
                <span className="font-semibold tabular-nums">&yen;{job.fee.toLocaleString()}</span>
              </InfoRow>
            )}
            {job.dates.map((d, i) => (
              <InfoRow key={i} label={d.type === "AUDITION" ? "オーディション" : d.type === "SHOOTING" ? "撮影" : "日程"}>
                <span className="tabular-nums">
                  {formatDate(d.date)}
                  {d.startTime && ` ${d.startTime}`}
                </span>
                {d.location && <span className="text-neutral-500">{` (${d.location})`}</span>}
              </InfoRow>
            ))}
            {job.deadline && (
              <InfoRow label="締切">
                <span className="tabular-nums">{formatDeadline(job.deadline)}</span>
              </InfoRow>
            )}
            {job.capacity != null && <InfoRow label="募集人数">{job.capacity}名</InfoRow>}
          </dl>

          {hasConditions && (
            <div className="mt-4 border-t border-neutral-200 pt-4">
              <h3 className="text-xs font-medium text-neutral-500">応募できる人の条件</h3>
              <dl className="mt-2 divide-y divide-neutral-100 text-sm">
                {job.genderReq && <InfoRow label="性別">{GENDER_LABELS[job.genderReq]}</InfoRow>}
                {(job.ageMin != null || job.ageMax != null) && (
                  <InfoRow label="年齢">{job.ageMin ?? "−"}〜{job.ageMax ?? "−"}歳</InfoRow>
                )}
                {(job.heightMin != null || job.heightMax != null) && (
                  <InfoRow label="身長">{job.heightMin ?? "−"}〜{job.heightMax ?? "−"}cm</InfoRow>
                )}
              </dl>
            </div>
          )}
        </section>

        {job.description && (
          <section>
            <h2 className="text-base font-semibold">詳細</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-neutral-800">{job.description}</p>
          </section>
        )}

        {openJob ? (
          <section className="space-y-4 border-t border-neutral-200 pt-6">
            <h2 className="text-lg font-semibold">応募する</h2>
            <JobApplicationForm jobId={openJob.id} talentId={talent.id} talentName={talent.name} requirements={openJob.requirements} hasResume={hasResume} dateConflict={dateConflict} token={t ?? null} fields={fields} alreadyApplied={!!myApplication} prefill={prefill} />
          </section>
        ) : (
          <div role="status" className="flex items-start gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-700">
            <Info className="mt-0.5 size-4 shrink-0 text-neutral-500" aria-hidden="true" />
            <span>
              {closedJob?.status === "CANCELLED" ? "この案件は中止になりました。" : "この案件の募集は終了しました。"}
              <span className="inline-block">応募の状況はマイページで確認できます。</span>
            </span>
          </div>
        )}
      </main>
    </div>
  )
}
