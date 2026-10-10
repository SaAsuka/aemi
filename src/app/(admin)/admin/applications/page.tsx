import { Suspense } from "react"
import Link from "next/link"
import { FileText, Plus } from "lucide-react"
import { getApplications, getApplicationCount } from "@/lib/actions/application"
import { getActiveTalentOptions, getOpenJobOptions } from "@/lib/queries"
import { getProductionCompanyList } from "@/lib/actions/production-company"
import { NewApplicationDialog } from "@/components/admin/new-application-dialog"
import { CsvExportButton } from "@/components/admin/csv-export-button"
import { exportApplicationsCsv } from "@/lib/actions/export"
import { ApplicationTable } from "@/components/admin/application-table"
import { JobTalentMatchSelect } from "@/components/admin/job-talent-match-select"
import { BTN_PRIMARY, BTN_SECONDARY, PANEL } from "@/components/admin/styles"

type ApplicationSearchParams = { status?: string; sort?: string; order?: string; page?: string; talentId?: string; missing?: string }

const STATUS_TABS = [
  { value: "ALL", label: "すべて" },
  { value: "APPLIED", label: "応募済み" },
  { value: "RESUME_SENT", label: "書類送付済" },
  { value: "ACCEPTED", label: "合格" },
  { value: "REJECTED", label: "不合格" },
  { value: "AUTO_REJECTED", label: "自動不合格" },
  { value: "CANCELLED", label: "キャンセル" },
]
const CSV_BUTTON = `${BTN_SECONDARY} [&_svg:not([class*='size-'])]:size-4`

async function ApplicationDialogData() {
  const [talents, jobs] = await Promise.all([getActiveTalentOptions(), getOpenJobOptions()])
  return <NewApplicationDialog talents={talents} jobs={jobs} className={`${BTN_PRIMARY} col-span-2 h-10 w-full sm:h-9 sm:w-auto`} />
}

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<ApplicationSearchParams>
}) {
  const params = await searchParams
  const { status, sort, order, page, talentId } = params
  const missingOnly = params.missing === "1"
  const [applications, totalCount, talents, productionCompanies] = await Promise.all([
    getApplications(status, undefined, sort, order, page ? Number(page) : 1, talentId, missingOnly),
    getApplicationCount(status, undefined, talentId, missingOnly),
    getActiveTalentOptions(),
    getProductionCompanyList(),
  ])

  const activeStatus = status && status !== "ALL" ? status : "ALL"
  const selectedTalent = talentId ? talents.find((t) => t.id === talentId) : undefined
  const isNarrowed = Boolean(talentId || activeStatus !== "ALL" || missingOnly)

  // 「未提出ありのみ」の切り替え（ページは1に戻す）
  const missingHref = (() => {
    const next = new URLSearchParams()
    for (const [k, v] of Object.entries(params)) if (v && k !== "missing" && k !== "page") next.set(k, v)
    if (!missingOnly) next.set("missing", "1")
    const qs = next.toString()
    return qs ? `/admin/applications?${qs}` : "/admin/applications"
  })()

  const pageSize = 50
  const currentPage = page ? Number(page) : 1
  const from = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const to = Math.min(currentPage * pageSize, totalCount)

  const tabHref = (value: string) => {
    const next = new URLSearchParams()
    for (const [k, v] of Object.entries(params)) if (v && k !== "status" && k !== "page") next.set(k, v)
    if (value !== "ALL") next.set("status", value)
    const qs = next.toString()
    return qs ? `/admin/applications?${qs}` : "/admin/applications"
  }

  return (
    <div className="space-y-6 pb-4">
      {/* 見出しと操作ボタン */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-neutral-950 sm:text-2xl">応募管理</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {selectedTalent
              ? `${selectedTalent.name}さんの応募 ${totalCount.toLocaleString()}件`
              : isNarrowed
                ? `条件に合う応募 ${totalCount.toLocaleString()}件`
                : `すべての応募 ${totalCount.toLocaleString()}件`}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
          <div className="col-span-2 sm:order-last">
            <Suspense
              fallback={
                <button type="button" disabled className={`${BTN_PRIMARY} h-10 w-full sm:h-9 sm:w-auto`}>
                  <Plus aria-hidden="true" />
                  新規応募
                </button>
              }
            >
              <ApplicationDialogData />
            </Suspense>
          </div>
          <CsvExportButton action={exportApplicationsCsv} filename="応募一覧.csv" className={`${CSV_BUTTON} col-span-2 sm:col-span-1`} />
        </div>
      </div>

      {/* 絞り込み */}
      <div className={`${PANEL} space-y-4 p-4 sm:p-5`}>
        <JobTalentMatchSelect
          talents={talents}
          defaultValue={talentId}
          id="application-talent"
          label="タレントで絞り込む"
          emptyLabel="すべてのタレント"
        />
        <nav aria-label="選考の状況で絞り込む" className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-0.5">
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
        <Link
          href={missingHref}
          aria-pressed={missingOnly}
          className={`inline-flex h-8 items-center rounded-full px-3.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950/30 ${
            missingOnly ? "bg-amber-500 font-medium text-white" : "text-amber-800 ring-1 ring-amber-300 hover:bg-amber-50"
          }`}
        >
          {missingOnly ? "未提出ありのみ表示中（解除）" : "未提出ありのみ"}
        </Link>
      </div>

      {/* 一覧 */}
      <section aria-label="応募一覧" className={`${PANEL} overflow-clip`}>
        {applications.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <FileText className="mx-auto size-8 text-neutral-300" aria-hidden="true" />
            {isNarrowed ? (
              <>
                <p className="mt-4 text-sm font-medium text-neutral-950">条件に合う応募はありません</p>
                <p className="mt-1 text-sm text-neutral-500">タブやタレントの指定を変えてお試しください。</p>
                <Link href="/admin/applications" className={`${BTN_SECONDARY} mt-6`}>
                  条件をすべてクリア
                </Link>
              </>
            ) : (
              <>
                <p className="mt-4 text-sm font-medium text-neutral-950">まだ応募はありません</p>
                <p className="mt-1 text-sm text-neutral-500">タレントが応募すると、ここに表示されます。事務所から「新規応募」で登録することもできます。</p>
              </>
            )}
          </div>
        ) : (
          <>
            <div className="border-b border-neutral-200 px-4 py-3 text-xs text-neutral-500 sm:px-5">
              <span className="font-medium text-neutral-950">{totalCount.toLocaleString()}件</span>中 {from.toLocaleString()}〜
              {to.toLocaleString()}件を表示
              <span className="ml-3 hidden sm:inline">チェックを入れると、まとめて状況の変更・削除ができます</span>
            </div>
            <ApplicationTable applications={applications} totalCount={totalCount} productionCompanies={productionCompanies} />
          </>
        )}
      </section>
    </div>
  )
}
