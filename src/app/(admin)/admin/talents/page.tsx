import Link from "next/link"
import { blobProxyUrl } from "@/lib/utils/blob"
import { getTalents, getTalentCount } from "@/lib/actions/talent"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { TALENT_STATUS_LABELS, SUBSCRIPTION_STATUS_LABELS } from "@/types"
import { SearchForm } from "@/components/admin/search-form"
import { TalentFilters } from "@/components/admin/talent-filters"
import { CompositePdfIconButton } from "@/components/admin/composite-pdf-button"
import { formatDate } from "@/lib/utils/date"
import { ArrowUpRight, ChevronRight, Plus, Search, Users } from "lucide-react"
import { RegisterLinkCopy } from "@/components/admin/register-link-copy"
import { InviteTalentButton } from "@/components/admin/invite-talent-button"
import { StripeSyncButton } from "@/components/admin/stripe-sync-button"
import { ClickableCard, ClickableRow } from "@/components/admin/clickable-row"
import { TalentAvatar } from "@/components/admin/talent-avatar"
import { StatusChip, SUBSCRIPTION_TONE, TALENT_STATUS_TONE } from "@/components/admin/status-chip"
import { Pagination } from "@/components/admin/pagination"
import { SortableHeader } from "@/components/admin/sortable-header"
import { CsvExportButton } from "@/components/admin/csv-export-button"
import { exportTalentsCsv } from "@/lib/actions/export"
import { BTN_PRIMARY, BTN_SECONDARY, FIELD, PANEL } from "@/components/admin/styles"

type TalentSearchParams = {
  q?: string
  heightMin?: string
  heightMax?: string
  bustMin?: string
  bustMax?: string
  waistMin?: string
  waistMax?: string
  hipMin?: string
  hipMax?: string
  shoeMin?: string
  shoeMax?: string
  line?: string
  subscription?: string
  sort?: string
  order?: string
  page?: string
}

function toNum(val: string | undefined): number | undefined {
  if (!val) return undefined
  const n = Number(val)
  return Number.isNaN(n) ? undefined : n
}

// 最終ログインが7日以上前か（赤字で知らせる）
function isOlderThan7Days(date: Date) {
  return Date.now() - new Date(date).getTime() > 7 * 24 * 60 * 60 * 1000
}

// 表の見出しはスクロールしても画面上端に残す。上端の余白（レイアウトの p-3 / sm:p-6）ぶん上にずらす
const HEAD = "-top-3 h-11 bg-neutral-50 px-4 text-xs font-medium text-neutral-500 sm:-top-6"
const CELL = "px-4 py-3.5"
const SEARCH_FIELD = `${FIELD} h-10 max-w-none pl-9`
const CSV_BUTTON = `${BTN_SECONDARY} [&_svg:not([class*='size-'])]:size-4`
const PAGER_BUTTON = "size-8 rounded-lg border-neutral-300 bg-white hover:bg-neutral-50"

export default async function TalentsPage({
  searchParams,
}: {
  searchParams: Promise<TalentSearchParams>
}) {
  const params = await searchParams
  const filters = {
    search: params.q,
    heightMin: toNum(params.heightMin),
    heightMax: toNum(params.heightMax),
    bustMin: toNum(params.bustMin),
    bustMax: toNum(params.bustMax),
    waistMin: toNum(params.waistMin),
    waistMax: toNum(params.waistMax),
    hipMin: toNum(params.hipMin),
    hipMax: toNum(params.hipMax),
    shoeMin: toNum(params.shoeMin),
    shoeMax: toNum(params.shoeMax),
    line: params.line,
    subscription: params.subscription,
    sort: params.sort,
    order: (params.order === "asc" ? "asc" : "desc") as "asc" | "desc",
    page: toNum(params.page) ?? 1,
  }
  const [talents, totalCount] = await Promise.all([
    getTalents(filters),
    getTalentCount(filters),
  ])
  const hasFilters = Object.keys(params).some((k) => !["q", "sort", "order", "page"].includes(k) && params[k as keyof TalentSearchParams])
  const isNarrowed = hasFilters || Boolean(params.q)

  const pageSize = 50
  const page = filters.page
  const from = totalCount === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, totalCount)

  const activeCount = talents.filter((t) => t.status === "ACTIVE").length
  const lineCount = talents.filter((t) => t.lineUserId).length
  const subscribedCount = talents.filter((t) => t.subscription?.status === "ACTIVE").length

  const lastLogin = (talent: (typeof talents)[number]) => {
    const at = talent.loginHistories[0]?.loggedAt
    if (!at) return <span className="text-neutral-400">未ログイン</span>
    return isOlderThan7Days(at) ? (
      <span className="font-medium text-red-600" title="7日以上ログインしていません">
        {formatDate(at)}
      </span>
    ) : (
      <span className="text-neutral-700">{formatDate(at)}</span>
    )
  }

  const composite = (talent: (typeof talents)[number]) => (
    <span className="inline-flex items-center gap-1">
      {talent.resume && (
        <a
          href={blobProxyUrl(talent.resume, true)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-sm font-medium text-neutral-950 transition-colors hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950/30"
        >
          表示
          <ArrowUpRight className="size-3.5 text-neutral-400" aria-hidden="true" />
          <span className="sr-only">（新しいタブで開きます）</span>
        </a>
      )}
      <CompositePdfIconButton
        talentId={talent.id}
        photoCount={talent._count.photos}
        hasResume={Boolean(talent.resume)}
      />
    </span>
  )

  const subscriptionOf = (talent: (typeof talents)[number]) => {
    const subStatus = talent.subscription?.status ?? "NONE"
    return (
      <StatusChip
        tone={SUBSCRIPTION_TONE[subStatus] ?? "gray"}
        label={SUBSCRIPTION_STATUS_LABELS[subStatus] ?? "未契約"}
      />
    )
  }

  const lineOf = (talent: (typeof talents)[number]) =>
    talent.lineUserId ? <StatusChip tone="green" label="連携済" /> : <StatusChip tone="gray" label="未連携" />

  // 宣材写真の1枚目 → なければプロフィール画像
  const photoOf = (talent: (typeof talents)[number]) => talent.photos[0]?.url ?? talent.profileImage

  const statusOf = (talent: (typeof talents)[number]) => (
    <StatusChip
      tone={TALENT_STATUS_TONE[talent.status] ?? "gray"}
      label={TALENT_STATUS_LABELS[talent.status] ?? talent.status}
    />
  )

  return (
    <div className="space-y-6 pb-4">
      {/* 見出しと操作ボタン */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-neutral-950 sm:text-2xl">タレント管理</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {isNarrowed ? `条件に合うタレント ${totalCount.toLocaleString()}名` : `登録タレント ${totalCount.toLocaleString()}名`}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
          <Link href="/admin/talents/new" className={`${BTN_PRIMARY} col-span-2 h-10 sm:order-last sm:h-9`}>
            <Plus aria-hidden="true" />
            新規登録
          </Link>
          <InviteTalentButton />
          <RegisterLinkCopy />
          <CsvExportButton action={exportTalentsCsv} filename="タレント一覧.csv" className={CSV_BUTTON} />
          <StripeSyncButton />
        </div>
      </div>

      {/* 検索と絞り込み */}
      <div className={`${PANEL} space-y-4 p-4 sm:p-5`}>
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400"
            aria-hidden="true"
          />
          <SearchForm
            placeholder="名前・フリガナ・メールで検索"
            defaultValue={params.q}
            className={SEARCH_FIELD}
          />
        </div>
        <TalentFilters />
      </div>

      {/* 一覧 */}
      <section aria-label="タレント一覧" className={`${PANEL} overflow-clip`}>
        {talents.length > 0 && (
          <div className="flex flex-col gap-2 border-b border-neutral-200 px-4 py-3 text-xs text-neutral-500 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <p>
              <span className="font-medium text-neutral-950">{totalCount.toLocaleString()}名</span>中{" "}
              {from.toLocaleString()}〜{to.toLocaleString()}名を表示
            </p>
            <p className="flex flex-wrap gap-x-3 gap-y-0.5">
              <span>表示中の内訳</span>
              <span className="whitespace-nowrap">アクティブ {activeCount}名</span>
              <span className="whitespace-nowrap">LINE連携 {lineCount}名</span>
              <span className="whitespace-nowrap">サブスク契約 {subscribedCount}名</span>
            </p>
          </div>
        )}

        {talents.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <Users className="mx-auto size-8 text-neutral-300" aria-hidden="true" />
            {isNarrowed ? (
              <>
                <p className="mt-4 text-sm font-medium text-neutral-950">条件に合うタレントが見つかりませんでした</p>
                <p className="mt-1 text-sm text-neutral-500">検索する言葉や、絞り込みの条件を変えてお試しください。</p>
                <Link href="/admin/talents" className={`${BTN_SECONDARY} mt-6`}>
                  条件をすべてクリア
                </Link>
              </>
            ) : (
              <>
                <p className="mt-4 text-sm font-medium text-neutral-950">まだタレントが登録されていません</p>
                <p className="mt-1 text-sm text-neutral-500">「新規登録」から最初のタレントを追加しましょう。</p>
                <Link href="/admin/talents/new" className={`${BTN_PRIMARY} mt-6`}>
                  <Plus aria-hidden="true" />
                  新規登録
                </Link>
              </>
            )}
          </div>
        ) : (
          <>
            {/* PC：表 */}
            <div className="hidden lg:block">
              <Table>
                <TableHeader className="[&_tr]:border-neutral-200">
                  <TableRow className="hover:bg-transparent">
                    <SortableHeader column="name" label="名前" className={HEAD} />
                    <SortableHeader column="nameKana" label="フリガナ" className={`${HEAD} hidden xl:table-cell`} />
                    <SortableHeader column="status" label="ステータス" className={HEAD} />
                    <TableHead className={HEAD}>LINE</TableHead>
                    <TableHead className={HEAD}>決済</TableHead>
                    <TableHead className={HEAD}>最終ログイン</TableHead>
                    <TableHead className={HEAD}>コンポジ</TableHead>
                    <TableHead className={`${HEAD} w-10`}>
                      <span className="sr-only">詳細</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {talents.map((talent) => (
                    <ClickableRow
                      key={talent.id}
                      href={`/admin/talents/${talent.id}`}
                      className="group border-neutral-100 hover:bg-neutral-50"
                    >
                      <TableCell className={`${CELL} py-2.5`}>
                        <div className="flex items-center gap-3">
                          <TalentAvatar url={photoOf(talent)} name={talent.name} />
                          <div className="min-w-0">
                            <Link
                              href={`/admin/talents/${talent.id}`}
                              className="font-medium text-neutral-950 underline-offset-4 hover:underline"
                            >
                              {talent.name}
                            </Link>
                            <p className="mt-0.5 text-xs text-neutral-500 xl:hidden">{talent.nameKana}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className={`${CELL} hidden text-neutral-500 xl:table-cell`}>{talent.nameKana}</TableCell>
                      <TableCell className={CELL}>{statusOf(talent)}</TableCell>
                      <TableCell className={CELL}>{lineOf(talent)}</TableCell>
                      <TableCell className={CELL}>{subscriptionOf(talent)}</TableCell>
                      <TableCell className={`${CELL} tabular-nums`}>{lastLogin(talent)}</TableCell>
                      <TableCell className={`${CELL} py-2`}>{composite(talent)}</TableCell>
                      <TableCell className={`${CELL} pl-0`}>
                        <Link
                          href={`/admin/talents/${talent.id}`}
                          aria-label={`${talent.name}さんの詳細`}
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
              {talents.map((talent) => (
                <li key={talent.id}>
                  <ClickableCard
                    href={`/admin/talents/${talent.id}`}
                    className="px-4 py-4 transition-colors active:bg-neutral-100 sm:px-5"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <TalentAvatar url={photoOf(talent)} name={talent.name} className="size-12" />
                        <div className="min-w-0">
                          <Link
                            href={`/admin/talents/${talent.id}`}
                            className="block truncate text-base font-medium text-neutral-950"
                          >
                            {talent.name}
                          </Link>
                          <p className="mt-0.5 truncate text-xs text-neutral-500">{talent.nameKana}</p>
                        </div>
                      </div>
                      <span className="flex shrink-0 items-center gap-2 text-sm">
                        {statusOf(talent)}
                        <ChevronRight className="size-4 text-neutral-300" aria-hidden="true" />
                      </span>
                    </div>
                    <dl className="mt-3 grid grid-cols-3 gap-3 text-sm">
                      <div className="min-w-0">
                        <dt className="text-xs text-neutral-500">LINE</dt>
                        <dd className="mt-1">{lineOf(talent)}</dd>
                      </div>
                      <div className="min-w-0">
                        <dt className="text-xs text-neutral-500">決済</dt>
                        <dd className="mt-1">{subscriptionOf(talent)}</dd>
                      </div>
                      <div className="min-w-0">
                        <dt className="text-xs text-neutral-500">最終ログイン</dt>
                        <dd className="mt-1 tabular-nums">{lastLogin(talent)}</dd>
                      </div>
                    </dl>
                    <div className="mt-3 flex items-center justify-between gap-3 border-t border-neutral-100 pt-3">
                      <span className="text-xs text-neutral-500">
                        コンポジ{talent.resume ? "" : "：未作成"}
                      </span>
                      {composite(talent)}
                    </div>
                  </ClickableCard>
                </li>
              ))}
            </ul>

            <Pagination
              total={totalCount}
              className="border-t border-neutral-200 px-4 sm:px-5"
              buttonClassName={PAGER_BUTTON}
            />
          </>
        )}
      </section>
    </div>
  )
}
