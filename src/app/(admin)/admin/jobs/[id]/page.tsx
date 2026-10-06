import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowUpRight, ChevronLeft, MapPin } from "lucide-react"
import { getJob } from "@/lib/actions/job"
import { syncJobStatusByDeadline } from "@/lib/job-status"
import { getActiveTalentsForMatching } from "@/lib/actions/talent"
import { matchTalentToJob } from "@/lib/utils/job-matching"
import { calcAge, formatDate, formatDeadline } from "@/lib/utils/date"
import { DeleteButton } from "@/components/admin/delete-button"
import { JobEditSheet } from "@/components/admin/job-edit-sheet"
import { JobDates } from "@/components/admin/job-dates"
import { APPLICATION_STATUS_LABELS, GENDER_LABELS, JOB_STATUS_LABELS, SUBMISSION_CATEGORY_LABELS } from "@/types"
import { ApplicationStatusSelect } from "@/components/admin/application-status-select"
import { LineCopyButton } from "@/components/admin/line-copy-button"
import { SubmissionLinks } from "@/components/admin/submission-links"
import { MatchingTalentsTable } from "@/components/admin/matching-talents-table"
import { JOB_STATUS_TONE, StatusChip } from "@/components/admin/status-chip"
import { BTN_PRIMARY, PANEL } from "@/components/admin/styles"

const DANGER_BUTTON =
  "inline-flex h-9 items-center justify-center rounded-lg border border-red-300 bg-white px-4 text-sm font-medium text-red-600 transition-colors hover:border-red-400 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600/30"

// 締切まであと何日か（日本時間の日付で数える）
function daysUntil(date: Date) {
  const toJstDay = (d: Date) => Math.floor((d.getTime() + 9 * 60 * 60 * 1000) / 86_400_000)
  return toJstDay(date) - toJstDay(new Date())
}
function isPast(date: Date) {
  return date.getTime() < Date.now()
}

function Section({
  title,
  count,
  description,
  children,
}: {
  title: string
  count?: number
  description?: string
  children: React.ReactNode
}) {
  return (
    <section className={`${PANEL} p-5 sm:p-6`}>
      <div className="flex items-baseline gap-2">
        <h2 className="text-base font-semibold text-neutral-950">{title}</h2>
        {count !== undefined && <span className="text-sm text-neutral-500">{count}</span>}
      </div>
      {description && <p className="mt-1 text-sm text-neutral-500">{description}</p>}
      <div className="mt-4">{children}</div>
    </section>
  )
}

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  await syncJobStatusByDeadline()
  const [job, allTalents] = await Promise.all([getJob(id), getActiveTalentsForMatching()])

  if (!job) notFound()

  const appliedTalentIds = new Set(job.applications.map((a) => a.talent.id))
  const matchingTalents = allTalents
    .filter((t) => !appliedTalentIds.has(t.id))
    .map((t) => ({
      ...t,
      age: t.birthDate ? calcAge(t.birthDate) : null,
      ...matchTalentToJob(t, job),
    }))
    .filter((t) => t.matchStatus !== "unmatch")

  const apps = job.applications
  const accepted = apps.filter((a) => a.status === "ACCEPTED").length
  const inProgress = apps.filter((a) => a.status === "APPLIED" || a.status === "RESUME_SENT").length

  const deadline = job.deadline
  const deadlineNote =
    deadline && job.status === "OPEN" && !isPast(deadline)
      ? (() => {
          const d = daysUntil(deadline)
          return d <= 0 ? "今日まで" : d <= 3 ? `あと${d}日` : null
        })()
      : null

  const conditions = [
    job.genderReq ? GENDER_LABELS[job.genderReq] : null,
    job.ageMin || job.ageMax ? `${job.ageMin ?? ""}〜${job.ageMax ?? ""}歳` : null,
    job.heightMin || job.heightMax ? `身長 ${job.heightMin ?? ""}〜${job.heightMax ?? ""}cm` : null,
  ].filter(Boolean)

  const facts = [
    { label: "応募", value: `${apps.length}名` },
    { label: "選考中", value: `${inProgress}名` },
    { label: "合格", value: `${accepted}名` },
    { label: "条件に合う（未応募）", value: `${matchingTalents.length}名` },
  ]

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-4">
      <Link
        href="/admin/jobs"
        className="-ml-1 inline-flex items-center gap-0.5 rounded-md px-1 py-0.5 text-sm text-neutral-500 transition-colors hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950/30"
      >
        <ChevronLeft className="size-4" aria-hidden="true" />
        案件管理
      </Link>

      {/* 案件名・状態・要点 */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusChip tone={JOB_STATUS_TONE[job.status] ?? "gray"} label={JOB_STATUS_LABELS[job.status] ?? job.status} />
          </div>
          <h1 className="mt-2 text-xl font-semibold leading-snug tracking-tight text-neutral-950 sm:text-2xl">{job.title}</h1>
          <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <div className="flex items-baseline gap-1.5">
              <dt className="text-neutral-500">報酬</dt>
              <dd className="font-medium text-neutral-950">{job.fee ? `¥${job.fee.toLocaleString()}` : "未定"}</dd>
            </div>
            <div className="flex items-baseline gap-1.5">
              <dt className="text-neutral-500">締切</dt>
              <dd className="font-medium tabular-nums text-neutral-950">
                {deadline ? formatDeadline(deadline) : "なし"}
                {deadlineNote && <span className="ml-1.5 text-xs font-medium text-red-600">{deadlineNote}</span>}
                {deadline && job.status === "OPEN" && isPast(deadline) && (
                  <span className="ml-1.5 text-xs text-neutral-500">締切済み</span>
                )}
              </dd>
            </div>
            <div className="flex items-baseline gap-1.5">
              <dt className="text-neutral-500">募集人数</dt>
              <dd className="font-medium text-neutral-950">{job.capacity ? `${job.capacity}名` : "指定なし"}</dd>
            </div>
            {job.location && (
              <div className="flex items-baseline gap-1.5">
                <dt className="sr-only">場所</dt>
                <dd className="flex items-center gap-1 text-neutral-700">
                  <MapPin className="size-4 shrink-0 text-neutral-400" aria-hidden="true" />
                  {job.location}
                </dd>
              </div>
            )}
          </dl>
        </div>
        <div className="shrink-0">
          <JobEditSheet job={job} requirements={job.requirements} className={`${BTN_PRIMARY} h-10 w-full sm:h-9 sm:w-auto`} />
        </div>
      </div>

      {/* 応募の数 */}
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-neutral-200 bg-neutral-200 sm:grid-cols-4">
        {facts.map((f) => (
          <div key={f.label} className="bg-white px-4 py-3.5 sm:px-5">
            <dt className="text-xs text-neutral-500">{f.label}</dt>
            <dd className="mt-1 text-lg font-semibold tracking-tight text-neutral-950">{f.value}</dd>
          </div>
        ))}
      </dl>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-6">
          <Section
            title="応募したタレント"
            count={apps.length}
            description="選考の状況はここで変えられます。「合格」にすると、続けてスケジュールを登録できます。"
          >
            {apps.length === 0 ? (
              <p className="rounded-lg bg-neutral-50 px-4 py-6 text-center text-sm text-neutral-500">
                まだ応募はありません。下の「条件に合うタレント」にLINEでお知らせを送れます。
              </p>
            ) : (
              <ul className="-mx-5 divide-y divide-neutral-100 border-t border-neutral-100 sm:-mx-6">
                {apps.map((app) => (
                  <li key={app.id} className="flex flex-col gap-3 px-5 py-3.5 sm:px-6 md:flex-row md:items-center">
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/admin/talents/${app.talent.id}`}
                        className="text-sm font-medium text-neutral-950 underline-offset-4 hover:underline"
                      >
                        {app.talent.name}
                      </Link>
                      <p className="mt-0.5 text-xs text-neutral-500">
                        応募日 {formatDate(app.appliedAt)}
                        {app.talent.birthDate && ` ・ ${calcAge(app.talent.birthDate)}歳`}
                        {app.talent.height && ` ・ ${app.talent.height}cm`}
                      </p>
                      <div className="mt-2">
                        <SubmissionLinks submissions={app.submissions} />
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      <LineCopyButton talent={app.talent} />
                      <div className="w-32" title={`選考の状況：${APPLICATION_STATUS_LABELS[app.status] ?? app.status}`}>
                        <ApplicationStatusSelect
                          applicationId={app.id}
                          currentStatus={app.status}
                          scheduleDate={app.schedule?.date ?? null}
                          talentName={app.talent.name}
                          jobTitle={job.title}
                        />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section
            title="条件に合うタレント"
            count={matchingTalents.length}
            description="まだ応募していない、条件（性別・年齢・身長）に合うタレントです。選んでLINEでお知らせを送れます。"
          >
            <MatchingTalentsTable
              jobId={job.id}
              talents={matchingTalents.map((t) => ({
                id: t.id,
                name: t.name,
                gender: t.gender,
                age: t.age,
                height: t.height,
                matchStatus: t.matchStatus as "match" | "partial",
                hasLine: !!t.lineUserId,
              }))}
            />
          </Section>
        </div>

        <aside className="min-w-0 space-y-6">
          <Section title="日程" description="オーディション日・撮影日など。タレントの案件ページにも表示されます。">
            <JobDates jobId={job.id} dates={job.dates} />
          </Section>

          <Section title="案件の内容">
            <dl className="space-y-4 text-sm">
              <div>
                <dt className="text-xs text-neutral-500">応募できる人の条件</dt>
                <dd className="mt-1 text-neutral-950">{conditions.length ? conditions.join(" ・ ") : "条件なし（だれでも応募できます）"}</dd>
              </div>
              <div>
                <dt className="text-xs text-neutral-500">提出してもらうもの</dt>
                <dd className="mt-1">
                  {job.requirements.length === 0 ? (
                    <span className="text-neutral-500">なし</span>
                  ) : (
                    <ul className="space-y-1.5">
                      {job.requirements.map((r) => (
                        <li key={r.id} className="text-neutral-950">
                          {SUBMISSION_CATEGORY_LABELS[r.category] ?? r.category}
                          {r.description && <span className="block text-xs text-neutral-500">{r.description}</span>}
                          {(r.referenceUrl || r.referenceFile) && (
                            <a
                              href={r.referenceUrl ?? r.referenceFile ?? "#"}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-0.5 inline-flex items-center gap-0.5 text-xs font-medium text-neutral-950 underline-offset-4 hover:underline"
                            >
                              参考資料
                              <ArrowUpRight className="size-3 text-neutral-400" aria-hidden="true" />
                              <span className="sr-only">（新しいタブで開きます）</span>
                            </a>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </dd>
              </div>
              {job.description && (
                <div>
                  <dt className="text-xs text-neutral-500">案件の説明</dt>
                  <dd className="mt-1 whitespace-pre-wrap leading-relaxed text-neutral-950">{job.description}</dd>
                </div>
              )}
              {job.note && (
                <div>
                  <dt className="text-xs text-neutral-500">備考（社内用）</dt>
                  <dd className="mt-1 whitespace-pre-wrap leading-relaxed text-neutral-950">{job.note}</dd>
                </div>
              )}
              <div>
                <dt className="text-xs text-neutral-500">登録日</dt>
                <dd className="mt-1 text-neutral-950">{formatDate(job.createdAt)}</dd>
              </div>
            </dl>
          </Section>
        </aside>
      </div>

      {/* 削除はうっかり押さないよう、いちばん下に離して置く */}
      <section className="rounded-xl border border-red-200 bg-white p-5 sm:flex sm:items-center sm:justify-between sm:gap-6 sm:p-6">
        <div>
          <h2 className="text-base font-semibold text-neutral-950">この案件を削除</h2>
          <p className="mt-1 text-sm text-neutral-500">
            {apps.length > 0
              ? `応募が${apps.length}件あるため削除できません。募集をやめる場合は「編集」で「募集終了」にしてください。`
              : "削除すると元に戻せません。募集をやめるだけなら「編集」で「募集終了」にしてください。"}
          </p>
        </div>
        {apps.length === 0 && (
          <DeleteButton
            id={job.id}
            type="job"
            label="削除する"
            className={`${DANGER_BUTTON} mt-4 w-full sm:mt-0 sm:w-auto`}
            confirmMessage={`「${job.title}」を削除します。\n元に戻せません。本当に削除しますか？`}
          />
        )}
      </section>
    </div>
  )
}
