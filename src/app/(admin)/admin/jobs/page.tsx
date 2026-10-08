import Link from "next/link"
import { Briefcase, ChevronRight, Plus, Search } from "lucide-react"
import { getJobs, getJobCount } from "@/lib/actions/job"
import { getActiveTalentsForMatching } from "@/lib/actions/talent"
import { ParseJobSheet } from "@/components/admin/parse-job-sheet"
import { JobTalentMatchSelect } from "@/components/admin/job-talent-match-select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { JOB_STATUS_LABELS } from "@/types"
import { SearchForm } from "@/components/admin/search-form"
import { matchTalentToJob } from "@/lib/utils/job-matching"
import { formatDeadline } from "@/lib/utils/date"
import { firstDateByType } from "@/lib/utils/job-dates"
import { Pagination } from "@/components/admin/pagination"
import { SortableHeader } from "@/components/admin/sortable-header"
import { CsvExportButton } from "@/components/admin/csv-export-button"
import { ClickableCard, ClickableRow } from "@/components/admin/clickable-row"
import { JOB_STATUS_TONE, StatusChip } from "@/components/admin/status-chip"
import { exportJobsCsv } from "@/lib/actions/export"
import { syncJobStatusByDeadline } from "@/lib/job-status"
import { BTN_PRIMARY, BTN_SECONDARY, FIELD, PANEL } from "@/components/admin/styles"

type JobSearchParams = { q?: string; status?: string; talentId?: string; sort?: string; order?: string; page?: string }

const STATUS_TABS = [
  { value: "ALL", label: "すべて" },
  { value: "OPEN", label: "募集中" },
  { value: "DRAFT", label: "下書き" },
  { value: "CLOSED", label: "募集終了" },
  { value: "CANCELLED", label: "キャンセル" },
]

// 表の見出しはスクロールしても画面上端に残す。上端の余白（レイアウトの p-3 / sm:p-6）ぶん上にずらす
const HEAD = "-top-3 h-11 bg-neutral-50 px-4 text-xs font-medium text-neutral-500 sm:-top-6"
const CELL = "px-4 py-3.5"
const CSV_BUTTON = `${BTN_SECONDARY} [&_svg:not([class*='size-'])]:size-4`
const PAGER_BUTTON = "size-8 rounded-lg border-neutral-300 bg-white hover:bg-neutral-50"

// 締切まであと何日か（日本時間の日付で数える）。過ぎていれば負の数
function daysUntil(date: Date) {
  const toJstDay = (d: Date) => Math.floor((d.getTime() + 9 * 60 * 60 * 1000) / 86_400_000)
  return toJstDay(date) - toJstDay(new Date())
}
function isPast(date: Date) {
  return date.getTime() < Date.now()
}

function Deadline({ deadline, status }: { deadline: Date | null; status: string }) {
  if (!deadline) return <span className="text-neutral-400">—</span>
  const watch = status === "OPEN"
  const past = isPast(deadline)
  const days = daysUntil(deadline)
  return (
    <span className="block">
      <span className={`tabular-nums ${watch && past ? "text-neutral-400" : "text-neutral-950"}`}>{formatDeadline(deadline)}</span>
      {watch && past && <span className="mt-0.5 block text-xs text-neutral-500">締切済み</span>}
      {watch && !past && days <= 3 && (
        <span className="mt-0.5 block text-xs font-medium text-red-600">{days <= 0 ? "今日まで" : `あと${days}日`}</span>
      )}
    </span>
  )
}

function Schedule({ dates }: { dates: Parameters<typeof firstDateByType>[0] }) {
  const audition = firstDateByType(dates, "AUDITION")
  const shooting = firstDateByType(dates, "SHOOTING")
  if (!audition && !shooting) return <span className="text-neutral-400">—</span>
  return (
    <span className="block space-y-0.5 text-xs tabular-nums">
      {audition && (
        <span className="block">
          <span className="text-neutral-500">オーディション</span> <span className="text-neutral-950">{audition}</span>
        </span>
      )}
      {shooting && (
        <span className="block">
          <span className="text-neutral-500">撮影</span> <span className="text-neutral-950">{shooting}</span>
        </span>
      )}
    </span>
  )
}

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<JobSearchParams>
}) {
  const params = await searchParams
  const { q, status, talentId, sort, order, page } = params
  // 締切を過ぎた案件をすぐ「募集終了」にしてから一覧・件数を取る
  await syncJobStatusByDeadline()
  const [jobs, talents, totalCount] = await Promise.all([
    getJobs(q, status, talentId, sort, order, page ? Number(page) : 1),
    getActiveTalentsForMatching(),
    getJobCount(q, status),
  ])

  // タレントで絞り込んだときは、合う案件をまとめて返すので件数はその数（ページ送りなし）
  const shownCount = talentId ? jobs.length : totalCount
  const matchTalent = talentId ? talents.find((t) => t.id === talentId) : undefined
  const activeStatus = status && status !== "ALL" ? status : "ALL"
  const isNarrowed = Boolean(q || talentId || activeStatus !== "ALL")

  const pageSize = 50
  const currentPage = page ? Number(page) : 1
  const from = shownCount === 0 ? 0 : talentId ? 1 : (currentPage - 1) * pageSize + 1
  const to = talentId ? shownCount : Math.min(currentPage * pageSize, shownCount)

  const tabHref = (value: string) => {
    const next = new URLSearchParams()
    for (const [k, v] of Object.entries(params)) if (v && k !== "status" && k !== "page") next.set(k, v)
    if (value !== "ALL") next.set("status", value)
    const qs = next.toString()
    return qs ? `/admin/jobs?${qs}` : "/admin/jobs"
  }

  const applicants = (job: (typeof jobs)[number]) => {
    const matchCount = talents.filter((t) => matchTalentToJob(t, job).matchStatus !== "unmatch").length
    return (
      <span className="block text-sm">
        <span className={job._count.applications > 0 ? "font-medium text-neutral-950" : "text-neutral-400"}>
          {job._count.applications}名応募
        </span>
        <span className="mt-0.5 block text-xs text-neutral-500" title="性別・年齢・身長が案件の条件に合うタレントの数">
          条件に合う {matchCount}名
        </span>
      </span>
    )
  }

  const statusOf = (job: (typeof jobs)[number]) => (
    <StatusChip tone={JOB_STATUS_TONE[job.status] ?? "gray"} label={JOB_STATUS_LABELS[job.status] ?? job.status} />
  )

  const fee = (job: (typeof jobs)[number]) =>
    job.fee ? (
      <span className="tabular-nums text-neutral-950">¥{job.fee.toLocaleString()}</span>
    ) : (
      <span className="text-neutral-400">未定</span>
    )

  return (
    <div className="space-y-6 pb-4">
      {/* 見出しと操作ボタン */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-neutral-950 sm:text-2xl">案件管理</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {matchTalent
              ? `${matchTalent.name}さんの条件に合う案件 ${shownCount.toLocaleString()}件`
              : isNarrowed
                ? `条件に合う案件 ${shownCount.toLocaleString()}件`
                : `登録されている案件 ${shownCount.toLocaleString()}件`}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
          <Link href="/admin/jobs/new" className={`${BTN_PRIMARY} col-span-2 h-10 sm:order-last sm:h-9`}>
            <Plus aria-hidden="true" />
            新規作成
          </Link>
          <ParseJobSheet />
          <CsvExportButton action={exportJobsCsv} filename="案件一覧.csv" className={CSV_BUTTON} />
        </div>
      </div>

      {/* 検索と絞り込み */}
      <div className={`${PANEL} space-y-4 p-4 sm:p-5`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <label htmlFor="job-search" className="mb-1.5 block text-xs font-medium text-neutral-600">
              案件名で探す
            </label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400"
                aria-hidden="true"
              />
              <SearchForm id="job-search" placeholder="例: CM、モデル、エキストラ" defaultValue={q} className={`${FIELD} max-w-none pl-9`} />
            </div>
          </div>
          <JobTalentMatchSelect talents={talents} defaultValue={talentId} />
        </div>
        <nav aria-label="ステータスで絞り込む" className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-0.5">
          {STATUS_TABS.map((tab) => {
            const active = tab.value === activeStatus
            return (
              <Link
                key={tab.value}
                href={tabHref(tab.value)}
                aria-current={active ? "page" : undefined}
                className={`inline-flex h-8 shrink-0 items-center rounded-full px-3.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950/30 ${
                  active ? "bg-neutral-950 font-medium text-white" : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950"
                }`}
              >
                {tab.label}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* 一覧 */}
      <section aria-label="案件一覧" className={`${PANEL} overflow-clip`}>
        {jobs.length > 0 && (
          <div className="border-b border-neutral-200 px-4 py-3 text-xs text-neutral-500 sm:px-5">
            <span className="font-medium text-neutral-950">{shownCount.toLocaleString()}件</span>中{" "}
            {from.toLocaleString()}〜{to.toLocaleString()}件を表示
          </div>
        )}

        {jobs.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <Briefcase className="mx-auto size-8 text-neutral-300" aria-hidden="true" />
            {isNarrowed ? (
              <>
                <p className="mt-4 text-sm font-medium text-neutral-950">条件に合う案件が見つかりませんでした</p>
                <p className="mt-1 text-sm text-neutral-500">検索する言葉や、絞り込みの条件を変えてお試しください。</p>
                <Link href="/admin/jobs" className={`${BTN_SECONDARY} mt-6`}>
                  条件をすべてクリア
                </Link>
              </>
            ) : (
              <>
                <p className="mt-4 text-sm font-medium text-neutral-950">まだ案件が登録されていません</p>
                <p className="mt-1 text-sm text-neutral-500">「新規作成」か「テキストから登録」で追加できます。</p>
                <Link href="/admin/jobs/new" className={`${BTN_PRIMARY} mt-6`}>
                  <Plus aria-hidden="true" />
                  新規作成
                </Link>
              </>
            )}
          </div>
        ) : (
          <>
            {/* 広い画面：表 */}
            <div className="hidden xl:block">
              <Table>
                <TableHeader className="[&_tr]:border-neutral-200">
                  <TableRow className="hover:bg-transparent">
                    <SortableHeader column="title" label="案件名" className={HEAD} />
                    <SortableHeader column="status" label="ステータス" className={HEAD} />
                    <SortableHeader column="fee" label="報酬" className={HEAD} />
                    <SortableHeader column="deadline" label="締切" className={HEAD} />
                    <TableHead className={HEAD}>日程</TableHead>
                    <TableHead className={HEAD}>応募</TableHead>
                    <TableHead className={`${HEAD} w-10`}>
                      <span className="sr-only">詳細</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.map((job) => (
                    <ClickableRow
                      key={job.id}
                      href={`/admin/jobs/${job.id}`}
                      className="group border-neutral-100 align-middle hover:bg-neutral-50"
                    >
                      <TableCell className={`${CELL} min-w-[14rem] max-w-[22rem] whitespace-normal`}>
                        <Link
                          href={`/admin/jobs/${job.id}`}
                          className="font-medium text-neutral-950 underline-offset-4 hover:underline"
                        >
                          {job.title}
                        </Link>
                      </TableCell>
                      <TableCell className={CELL}>{statusOf(job)}</TableCell>
                      <TableCell className={CELL}>{fee(job)}</TableCell>
                      <TableCell className={CELL}>
                        <Deadline deadline={job.deadline} status={job.status} />
                      </TableCell>
                      <TableCell className={CELL}>
                        <Schedule dates={job.dates} />
                      </TableCell>
                      <TableCell className={CELL}>{applicants(job)}</TableCell>
                      <TableCell className={`${CELL} pl-0`}>
                        <Link
                          href={`/admin/jobs/${job.id}`}
                          aria-label={`${job.title}の詳細`}
                          className="inline-flex size-8 items-center justify-center rounded-md text-neutral-300 transition-colors group-hover:text-neutral-950 hover:bg-neutral-100"
                        >
                          <ChevronRight className="size-4" aria-hidden="true" />
                        </Link>
                      </TableCell>
                    </ClickableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* スマホ・タブレット・狭いPC：カード */}
            <ul className="divide-y divide-neutral-100 xl:hidden">
              {jobs.map((job) => (
                <li key={job.id}>
                  <ClickableCard
                    href={`/admin/jobs/${job.id}`}
                    className="px-4 py-4 transition-colors active:bg-neutral-100 sm:px-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <Link
                        href={`/admin/jobs/${job.id}`}
                        className="min-w-0 text-base font-medium leading-snug text-neutral-950"
                      >
                        {job.title}
                      </Link>
                      <span className="flex shrink-0 items-center gap-1">
                        {statusOf(job)}
                        <ChevronRight className="size-4 text-neutral-300" aria-hidden="true" />
                      </span>
                    </div>
                    <dl className="mt-3 grid grid-cols-3 gap-3 text-sm">
                      <div className="min-w-0">
                        <dt className="text-xs text-neutral-500">報酬</dt>
                        <dd className="mt-1">{fee(job)}</dd>
                      </div>
                      <div className="min-w-0">
                        <dt className="text-xs text-neutral-500">締切</dt>
                        <dd className="mt-1 text-xs">
                          <Deadline deadline={job.deadline} status={job.status} />
                        </dd>
                      </div>
                      <div className="min-w-0">
                        <dt className="text-xs text-neutral-500">応募</dt>
                        <dd className="mt-1">{applicants(job)}</dd>
                      </div>
                    </dl>
                    {(firstDateByType(job.dates, "AUDITION") || firstDateByType(job.dates, "SHOOTING")) && (
                      <div className="mt-3 border-t border-neutral-100 pt-3">
                        <Schedule dates={job.dates} />
                      </div>
                    )}
                  </ClickableCard>
                </li>
              ))}
            </ul>

            {!talentId && (
              <Pagination
                total={totalCount}
                className="border-t border-neutral-200 px-4 sm:px-5"
                buttonClassName={PAGER_BUTTON}
              />
            )}
          </>
        )}
      </section>
    </div>
  )
}
