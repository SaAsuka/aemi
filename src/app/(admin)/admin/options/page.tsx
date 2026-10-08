import Link from "next/link"
import { ChevronRight, Plus, Search, ShoppingBag } from "lucide-react"
import { getOptions, getOptionCount } from "@/lib/actions/option"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { OPTION_STATUS_LABELS, OPTION_CATEGORY_LABELS } from "@/types"
import { SearchForm } from "@/components/admin/search-form"
import { Pagination } from "@/components/admin/pagination"
import { ClickableCard, ClickableRow } from "@/components/admin/clickable-row"
import { TalentAvatar } from "@/components/admin/talent-avatar"
import { StatusChip, type ChipTone } from "@/components/admin/status-chip"
import { BTN_PRIMARY, BTN_SECONDARY, FIELD, PANEL } from "@/components/admin/styles"
import { formatDeadline } from "@/lib/utils/date"

type OptionSearchParams = { q?: string; status?: string; page?: string }

const STATUS_TABS = [
  { value: "ALL", label: "すべて" },
  { value: "ACTIVE", label: "公開中" },
  { value: "DRAFT", label: "下書き" },
  { value: "CLOSED", label: "終了" },
]
// 公開中＝緑・下書き（まだタレントに見えない）＝黄・終了＝グレー
const OPTION_STATUS_TONE: Record<string, ChipTone> = { ACTIVE: "green", DRAFT: "yellow", CLOSED: "gray" }

const HEAD = "-top-3 h-11 bg-neutral-50 px-4 text-xs font-medium text-neutral-500 sm:-top-6"
const CELL = "px-4 py-3 align-middle"
const PAGER_BUTTON = "size-8 rounded-lg border-neutral-300 bg-white hover:bg-neutral-50"

// 締切まであと何日か（日本時間の日付で数える）
function daysUntil(date: Date) {
  const toJstDay = (d: Date) => Math.floor((d.getTime() + 9 * 60 * 60 * 1000) / 86_400_000)
  return toJstDay(date) - toJstDay(new Date())
}
function isPast(date: Date) {
  return date.getTime() < Date.now()
}

function Deadline({ deadline, status }: { deadline: Date | null; status: string }) {
  if (!deadline) return <span className="text-neutral-400">なし</span>
  const watch = status === "ACTIVE"
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

function CategoryTag({ category }: { category: string }) {
  return (
    <span className="inline-flex h-5 items-center rounded border border-neutral-300 px-1.5 text-[11px] text-neutral-600">
      {OPTION_CATEGORY_LABELS[category] ?? category}
    </span>
  )
}

export default async function OptionsPage({
  searchParams,
}: {
  searchParams: Promise<OptionSearchParams>
}) {
  const params = await searchParams
  const { q, status, page } = params
  const [options, totalCount] = await Promise.all([
    getOptions(q, status, page ? Number(page) : 1),
    getOptionCount(q, status),
  ])

  const activeStatus = status && status !== "ALL" ? status : "ALL"
  const isNarrowed = Boolean(q || activeStatus !== "ALL")
  const pageSize = 50
  const currentPage = page ? Number(page) : 1
  const from = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const to = Math.min(currentPage * pageSize, totalCount)

  const tabHref = (value: string) => {
    const next = new URLSearchParams()
    for (const [k, v] of Object.entries(params)) if (v && k !== "status" && k !== "page") next.set(k, v)
    if (value !== "ALL") next.set("status", value)
    const qs = next.toString()
    return qs ? `/admin/options?${qs}` : "/admin/options"
  }

  const statusOf = (opt: (typeof options)[number]) => (
    <StatusChip tone={OPTION_STATUS_TONE[opt.status] ?? "gray"} label={OPTION_STATUS_LABELS[opt.status] ?? opt.status} />
  )

  return (
    <div className="space-y-6 pb-4">
      {/* 見出しと操作ボタン */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-neutral-950 sm:text-2xl">オプション管理</h1>
          <p className="mt-1 text-sm text-neutral-500">
            タレントが購入できる撮影・レッスンなどのオプションです。
            <span className="inline-block">
              {isNarrowed ? `条件に合うオプション ${totalCount.toLocaleString()}件` : `登録 ${totalCount.toLocaleString()}件`}
            </span>
          </p>
        </div>
        <Link href="/admin/options/new" className={`${BTN_PRIMARY} h-10 w-full sm:h-9 sm:w-auto`}>
          <Plus aria-hidden="true" />
          新規作成
        </Link>
      </div>

      {/* 検索と絞り込み */}
      <div className={`${PANEL} space-y-4 p-4 sm:p-5`}>
        <div>
          <label htmlFor="option-search" className="mb-1.5 block text-xs font-medium text-neutral-600">
            オプション名で探す
          </label>
          <div className="relative sm:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400" aria-hidden="true" />
            <SearchForm id="option-search" placeholder="例: 宣材撮影、演技レッスン" defaultValue={q} className={`${FIELD} max-w-none pl-9`} />
          </div>
        </div>
        <nav aria-label="状態で絞り込む" className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-0.5">
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
      <section aria-label="オプション一覧" className={`${PANEL} overflow-clip`}>
        {options.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <ShoppingBag className="mx-auto size-8 text-neutral-300" aria-hidden="true" />
            {isNarrowed ? (
              <>
                <p className="mt-4 text-sm font-medium text-neutral-950">条件に合うオプションが見つかりませんでした</p>
                <p className="mt-1 text-sm text-neutral-500">検索する言葉やタブを変えてお試しください。</p>
                <Link href="/admin/options" className={`${BTN_SECONDARY} mt-6`}>
                  条件をすべてクリア
                </Link>
              </>
            ) : (
              <>
                <p className="mt-4 text-sm font-medium text-neutral-950">まだオプションがありません</p>
                <p className="mt-1 text-sm text-neutral-500">「新規作成」から、タレントが購入できる撮影やレッスンを追加できます。</p>
                <Link href="/admin/options/new" className={`${BTN_PRIMARY} mt-6`}>
                  <Plus aria-hidden="true" />
                  新規作成
                </Link>
              </>
            )}
          </div>
        ) : (
          <>
            <div className="border-b border-neutral-200 px-4 py-3 text-xs text-neutral-500 sm:px-5">
              <span className="font-medium text-neutral-950">{totalCount.toLocaleString()}件</span>中 {from.toLocaleString()}〜
              {to.toLocaleString()}件を表示
            </div>

            {/* 広い画面：表 */}
            <div className="hidden lg:block">
              <Table>
                <TableHeader className="[&_tr]:border-neutral-200">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className={HEAD}>オプション</TableHead>
                    <TableHead className={HEAD}>状態</TableHead>
                    <TableHead className={HEAD}>価格</TableHead>
                    <TableHead className={HEAD}>締切</TableHead>
                    <TableHead className={HEAD}>購入</TableHead>
                    <TableHead className={`${HEAD} w-10`}>
                      <span className="sr-only">詳細</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {options.map((opt) => (
                    <ClickableRow key={opt.id} href={`/admin/options/${opt.id}`} className="group border-neutral-100 hover:bg-neutral-50">
                      <TableCell className={`${CELL} max-w-[26rem] whitespace-normal`}>
                        <div className="flex items-center gap-3">
                          <TalentAvatar url={opt.imageUrl} name={opt.name} className="size-11" />
                          <div className="min-w-0">
                            <Link
                              href={`/admin/options/${opt.id}`}
                              className="text-sm font-medium text-neutral-950 underline-offset-4 hover:underline"
                            >
                              {opt.name}
                            </Link>
                            <div className="mt-1">
                              <CategoryTag category={opt.category} />
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className={CELL}>{statusOf(opt)}</TableCell>
                      <TableCell className={`${CELL} tabular-nums text-neutral-950`}>¥{opt.price.toLocaleString()}</TableCell>
                      <TableCell className={CELL}>
                        <Deadline deadline={opt.deadline} status={opt.status} />
                      </TableCell>
                      <TableCell className={CELL}>
                        <span className={opt._count.purchases > 0 ? "font-medium text-neutral-950" : "text-neutral-400"}>
                          {opt._count.purchases}件
                        </span>
                      </TableCell>
                      <TableCell className={`${CELL} pl-0`}>
                        <Link
                          href={`/admin/options/${opt.id}`}
                          aria-label={`${opt.name}の詳細`}
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

            {/* スマホ・タブレット：カード */}
            <ul className="divide-y divide-neutral-100 lg:hidden">
              {options.map((opt) => (
                <li key={opt.id}>
                  <ClickableCard href={`/admin/options/${opt.id}`} className="flex gap-3 px-4 py-4 transition-colors active:bg-neutral-100 sm:px-5">
                    <TalentAvatar url={opt.imageUrl} name={opt.name} className="size-14" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <Link href={`/admin/options/${opt.id}`} className="min-w-0 text-sm font-medium leading-snug text-neutral-950">
                          {opt.name}
                        </Link>
                        <span className="flex shrink-0 items-center gap-1">
                          {statusOf(opt)}
                          <ChevronRight className="size-4 text-neutral-300" aria-hidden="true" />
                        </span>
                      </div>
                      <div className="mt-1">
                        <CategoryTag category={opt.category} />
                      </div>
                      <dl className="mt-2.5 grid grid-cols-3 gap-2 text-sm">
                        <div className="min-w-0">
                          <dt className="text-xs text-neutral-500">価格</dt>
                          <dd className="mt-0.5 tabular-nums text-neutral-950">¥{opt.price.toLocaleString()}</dd>
                        </div>
                        <div className="min-w-0">
                          <dt className="text-xs text-neutral-500">締切</dt>
                          <dd className="mt-0.5 text-xs">
                            <Deadline deadline={opt.deadline} status={opt.status} />
                          </dd>
                        </div>
                        <div className="min-w-0">
                          <dt className="text-xs text-neutral-500">購入</dt>
                          <dd className={`mt-0.5 ${opt._count.purchases > 0 ? "text-neutral-950" : "text-neutral-400"}`}>
                            {opt._count.purchases}件
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </ClickableCard>
                </li>
              ))}
            </ul>

            <Pagination total={totalCount} className="border-t border-neutral-200 px-4 sm:px-5" buttonClassName={PAGER_BUTTON} />
          </>
        )}
      </section>
    </div>
  )
}
