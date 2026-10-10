import { notFound } from "next/navigation"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { getApplicationDetail } from "@/lib/actions/application-detail"
import { buildAnswerRows, zipEntryNames } from "@/lib/submission-fields"
import { formatDate } from "@/lib/utils/date"
import { APPLICATION_STATUS_LABELS } from "@/types"
import { APPLICATION_TONE, StatusChip } from "@/components/admin/status-chip"
import { SubmissionLinks } from "@/components/admin/submission-links"
import { ApplicationAnswers } from "@/components/admin/application-answers"
import { PhotoZipButton } from "@/components/admin/photo-zip-button"
import { PANEL } from "@/components/admin/styles"

function Section({ title, description, action, children }: {
  title: string
  description?: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className={`${PANEL} p-5 sm:p-6`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-neutral-950">{title}</h2>
          {description && <p className="mt-1 text-sm text-neutral-500">{description}</p>}
        </div>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  )
}

export default async function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const app = await getApplicationDetail(id)
  if (!app) notFound()

  const rows = buildAnswerRows(app.fields, app.answers)
  const zipEntries = zipEntryNames(app.talent.name, rows)
  const hasFields = app.fields.length > 0 || app.answers.length > 0

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link
        href="/admin/applications"
        className="inline-flex items-center gap-1 text-sm text-neutral-500 transition-colors hover:text-neutral-950"
      >
        <ChevronLeft className="size-4" aria-hidden="true" />
        応募管理
      </Link>

      <div>
        <StatusChip tone={APPLICATION_TONE[app.status] ?? "gray"} label={APPLICATION_STATUS_LABELS[app.status] ?? app.status} />
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-neutral-950">
          <Link href={`/admin/talents/${app.talent.id}`} className="underline-offset-4 hover:underline">
            {app.talent.name}
          </Link>
          <span className="ml-2 text-base font-normal text-neutral-500">の応募</span>
        </h1>
        <p className="mt-2 text-sm text-neutral-600">
          <Link href={`/admin/jobs/${app.job.id}`} className="underline-offset-4 hover:underline">
            {app.job.title}
          </Link>
          <span className="ml-2 text-neutral-500">応募日 {formatDate(app.appliedAt)}</span>
        </p>
      </div>

      {hasFields && (
        <Section
          title="提出項目"
          description={app.hasMissingAnswers ? "必須の項目に未提出（別途送付待ちを含む）があります。" : undefined}
          action={<PhotoZipButton entries={zipEntries} zipName={`${app.talent.name}_${app.job.title}_写真.zip`} />}
        >
          <ApplicationAnswers rows={rows} resumeUrl={app.talent.resume} />
        </Section>
      )}

      {app.submissions.length > 0 && (
        <Section title="提出物" description="今までの提出物（課題演技動画・ボイスサンプル・過去出演動画・宣材写真）">
          <SubmissionLinks submissions={app.submissions} />
        </Section>
      )}

      {!hasFields && app.submissions.length === 0 && (
        <p className={`${PANEL} px-5 py-6 text-center text-sm text-neutral-500`}>この応募に提出物はありません。</p>
      )}
    </div>
  )
}
