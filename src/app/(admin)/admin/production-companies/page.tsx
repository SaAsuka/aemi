import Link from "next/link"
import { Building2, ChevronRight, Mail, Phone, Plus, Search } from "lucide-react"
import { getProductionCompanies } from "@/lib/actions/production-company"
import { isFreeeConnected } from "@/lib/freee"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { SearchForm } from "@/components/admin/search-form"
import { FreeeSyncButton } from "@/components/admin/freee-sync-button"
import { ClickableCard, ClickableRow } from "@/components/admin/clickable-row"
import { StatusChip } from "@/components/admin/status-chip"
import { CompanyMark } from "@/components/admin/company-mark"
import { BTN_PRIMARY, BTN_SECONDARY, FIELD, PANEL } from "@/components/admin/styles"

const HEAD = "-top-3 h-11 bg-neutral-50 px-4 text-xs font-medium text-neutral-500 sm:-top-6"
const CELL = "px-4 py-3 align-middle"

// withName：列見出しが無いカードでは「freee」を付けて何の連携かわかるようにする
function FreeeStatus({ linked, withName }: { linked: boolean; withName?: boolean }) {
  const prefix = withName ? "freee" : ""
  return linked ? (
    <StatusChip tone="green" label={`${prefix}連携済み`} />
  ) : (
    <span className="text-xs text-neutral-400">{withName ? "freee 未連携" : "未連携"}</span>
  )
}

const CONTACT_LINK =
  "inline-flex min-w-0 items-center gap-1.5 text-neutral-700 underline-offset-4 hover:text-neutral-950 hover:underline"

export default async function ProductionCompaniesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const [companies, connected] = await Promise.all([getProductionCompanies(q), isFreeeConnected()])
  const isNarrowed = Boolean(q)

  return (
    <div className="space-y-6 pb-4">
      {/* 見出しと操作ボタン */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-neutral-950 sm:text-2xl">制作会社管理</h1>
          <p className="mt-1 text-sm text-neutral-500">
            請求書の宛先になる制作会社です。
            <span className="inline-block">
              {isNarrowed ? `条件に合う会社 ${companies.length.toLocaleString()}件` : `登録 ${companies.length.toLocaleString()}件`}
            </span>
          </p>
        </div>
        <div className="flex gap-2">
          <FreeeSyncButton connected={connected} className={`${BTN_SECONDARY} h-10 flex-1 sm:h-9 sm:flex-none`} />
          <Link href="/admin/production-companies/new" className={`${BTN_PRIMARY} h-10 flex-1 sm:h-9 sm:flex-none`}>
            <Plus aria-hidden="true" />
            新規登録
          </Link>
        </div>
      </div>

      {/* 検索 */}
      <div className={`${PANEL} p-4 sm:p-5`}>
        <label htmlFor="company-search" className="mb-1.5 block text-xs font-medium text-neutral-600">
          会社名・担当者名で探す
        </label>
        <div className="relative sm:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400" aria-hidden="true" />
          <SearchForm id="company-search" placeholder="例: 東京キャスティング、山口" defaultValue={q} className={`${FIELD} max-w-none pl-9`} />
        </div>
      </div>

      {/* 一覧 */}
      <section aria-label="制作会社一覧" className={`${PANEL} overflow-clip`}>
        {companies.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <Building2 className="mx-auto size-8 text-neutral-300" aria-hidden="true" />
            {isNarrowed ? (
              <>
                <p className="mt-4 text-sm font-medium text-neutral-950">「{q}」に合う会社が見つかりませんでした</p>
                <p className="mt-1 text-sm text-neutral-500">会社名の一部（「株式会社」を除いた名前など）でお試しください。</p>
                <Link href="/admin/production-companies" className={`${BTN_SECONDARY} mt-6`}>
                  検索をクリア
                </Link>
              </>
            ) : (
              <>
                <p className="mt-4 text-sm font-medium text-neutral-950">まだ制作会社が登録されていません</p>
                <p className="mt-1 text-sm text-neutral-500">
                  「新規登録」から追加するか、freeeと連携している場合は「freeeから取り込む」でまとめて追加できます。
                </p>
                <Link href="/admin/production-companies/new" className={`${BTN_PRIMARY} mt-6`}>
                  <Plus aria-hidden="true" />
                  新規登録
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
                    <TableHead className={HEAD}>会社名</TableHead>
                    <TableHead className={HEAD}>担当者</TableHead>
                    <TableHead className={HEAD}>連絡先</TableHead>
                    <TableHead className={HEAD}>freee</TableHead>
                    <TableHead className={HEAD}>請求書</TableHead>
                    <TableHead className={`${HEAD} w-10`}>
                      <span className="sr-only">詳細</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companies.map((c) => (
                    <ClickableRow
                      key={c.id}
                      href={`/admin/production-companies/${c.id}`}
                      className="group border-neutral-100 hover:bg-neutral-50"
                    >
                      <TableCell className={`${CELL} max-w-[22rem] whitespace-normal`}>
                        <div className="flex items-center gap-3">
                          <CompanyMark name={c.companyName} />
                          <Link
                            href={`/admin/production-companies/${c.id}`}
                            className="min-w-0 text-sm font-medium text-neutral-950 underline-offset-4 hover:underline"
                          >
                            {c.companyName}
                          </Link>
                        </div>
                      </TableCell>
                      <TableCell className={`${CELL} text-neutral-950`}>
                        {c.contactName ?? <span className="text-neutral-400">未登録</span>}
                      </TableCell>
                      <TableCell className={`${CELL} text-sm`}>
                        {c.contactEmail || c.contactPhone ? (
                          <div className="space-y-0.5">
                            {c.contactEmail && (
                              <a href={`mailto:${c.contactEmail}`} className={CONTACT_LINK}>
                                <Mail className="size-3.5 shrink-0 text-neutral-400" aria-hidden="true" />
                                <span className="truncate">{c.contactEmail}</span>
                              </a>
                            )}
                            {c.contactPhone && (
                              <div className="flex items-center gap-1.5 tabular-nums text-neutral-700">
                                <Phone className="size-3.5 shrink-0 text-neutral-400" aria-hidden="true" />
                                {c.contactPhone}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-neutral-400">未登録</span>
                        )}
                      </TableCell>
                      <TableCell className={CELL}>
                        <FreeeStatus linked={Boolean(c.freeePartnerId)} />
                      </TableCell>
                      <TableCell className={CELL}>
                        <span className={c._count.invoices > 0 ? "font-medium tabular-nums text-neutral-950" : "text-neutral-400"}>
                          {c._count.invoices}件
                        </span>
                      </TableCell>
                      <TableCell className={`${CELL} pl-0`}>
                        <Link
                          href={`/admin/production-companies/${c.id}`}
                          aria-label={`${c.companyName}の詳細`}
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
              {companies.map((c) => (
                <li key={c.id}>
                  <ClickableCard
                    href={`/admin/production-companies/${c.id}`}
                    className="flex gap-3 px-4 py-4 transition-colors active:bg-neutral-100 sm:px-5"
                  >
                    <CompanyMark name={c.companyName} className="size-11 text-sm" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          href={`/admin/production-companies/${c.id}`}
                          className="min-w-0 text-sm font-medium leading-snug text-neutral-950"
                        >
                          {c.companyName}
                        </Link>
                        <ChevronRight className="mt-0.5 size-4 shrink-0 text-neutral-300" aria-hidden="true" />
                      </div>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-neutral-500">
                        <span>{c.contactName ?? "担当者 未登録"}</span>
                        {/* スマホからそのまま電話をかけられるように */}
                        {c.contactPhone && (
                          <a href={`tel:${c.contactPhone.replace(/[^\d+]/g, "")}`} className={CONTACT_LINK}>
                            <Phone className="size-3 shrink-0 text-neutral-400" aria-hidden="true" />
                            <span className="tabular-nums">{c.contactPhone}</span>
                          </a>
                        )}
                      </p>
                      <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
                        <FreeeStatus linked={Boolean(c.freeePartnerId)} withName />
                        <span className={c._count.invoices > 0 ? "text-neutral-700" : "text-neutral-400"}>
                          請求書 <span className="font-medium tabular-nums">{c._count.invoices}件</span>
                        </span>
                      </div>
                    </div>
                  </ClickableCard>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  )
}
