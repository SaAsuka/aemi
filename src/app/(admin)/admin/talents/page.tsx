import Link from "next/link"
import { blobProxyUrl } from "@/lib/utils/blob"
import { getTalents, getTalentCount } from "@/lib/actions/talent"
import { LinkButton } from "@/components/admin/link-button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { StatusBadge } from "@/components/admin/status-badge"
import { TALENT_STATUS_LABELS, SUBSCRIPTION_STATUS_LABELS, STATUS_COLORS } from "@/types"
import { SearchForm } from "@/components/admin/search-form"
import { TalentFilters } from "@/components/admin/talent-filters"
import { CompositePdfIconButton } from "@/components/admin/composite-pdf-button"
import { ExternalLink, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { RegisterLinkCopy } from "@/components/admin/register-link-copy"
import { InviteTalentButton } from "@/components/admin/invite-talent-button"
import { ClickableRow } from "@/components/admin/clickable-row"
import { Pagination } from "@/components/admin/pagination"
import { SortableHeader } from "@/components/admin/sortable-header"
import { CsvExportButton } from "@/components/admin/csv-export-button"
import { exportTalentsCsv } from "@/lib/actions/export"

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
  sort?: string
  order?: string
  page?: string
}

function toNum(val: string | undefined): number | undefined {
  if (!val) return undefined
  const n = Number(val)
  return Number.isNaN(n) ? undefined : n
}

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
    sort: params.sort,
    order: (params.order === "asc" ? "asc" : "desc") as "asc" | "desc",
    page: toNum(params.page) ?? 1,
  }
  const [talents, totalCount] = await Promise.all([
    getTalents(filters),
    getTalentCount(filters),
  ])
  const hasFilters = Object.keys(params).some((k) => !["q", "sort", "order", "page"].includes(k) && params[k as keyof TalentSearchParams])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl sm:text-2xl font-bold">タレント管理</h1>
        <div className="flex items-center gap-2">
          <CsvExportButton action={exportTalentsCsv} filename="タレント一覧.csv" />
          <InviteTalentButton />
          <RegisterLinkCopy />
          <LinkButton href="/admin/talents/new">新規登録</LinkButton>
        </div>
      </div>

      <SearchForm placeholder="名前・フリガナ・メールで検索" defaultValue={params.q} />

      <TalentFilters />

      <div className="flex flex-wrap gap-3 text-sm">
        <span className="rounded-md bg-green-50 px-3 py-1 text-green-700">
          アクティブ {talents.filter(t => t.status === "ACTIVE").length}名
        </span>
        <span className="rounded-md bg-blue-50 px-3 py-1 text-blue-700">
          LINE連携 {talents.filter(t => t.lineUserId).length}名
        </span>
        <span className="rounded-md bg-purple-50 px-3 py-1 text-purple-700">
          サブスク契約 {talents.filter(t => t.subscription?.status === "ACTIVE").length}名
        </span>
      </div>

      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-primary text-lg">タレント一覧<span className="ml-2 text-sm font-normal text-muted-foreground">({totalCount}件){hasFilters && " フィルタ中"}</span></CardTitle>
        </CardHeader>
        <CardContent className="overflow-auto max-h-[70vh] px-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/60 hover:bg-muted/60 sticky top-0 z-10">
                <SortableHeader column="name" label="名前" />
                <SortableHeader column="nameKana" label="フリガナ" className="hidden sm:table-cell" />
                <SortableHeader column="status" label="ステータス" />
                <TableHead>LINE</TableHead>
                <TableHead>決済</TableHead>
                <TableHead>コンポジ生成</TableHead>
                <TableHead>コンポジPDF</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {talents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    データがありません
                  </TableCell>
                </TableRow>
              ) : (
                talents.map((talent, i) => (
                  <ClickableRow key={talent.id} href={`/admin/talents/${talent.id}`} className={i % 2 === 1 ? "bg-muted/30" : ""}>
                    <TableCell>
                      <Link
                        href={`/admin/talents/${talent.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {talent.name}
                      </Link>
                      <p className="text-xs text-muted-foreground sm:hidden">{talent.nameKana}</p>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">{talent.nameKana}</TableCell>
                    <TableCell>
                      <StatusBadge
                        status={talent.status}
                        label={TALENT_STATUS_LABELS[talent.status]}
                      />
                    </TableCell>
                    <TableCell>
                      {talent.lineUserId ? (
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800">連携済</span>
                      ) : (
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-800">未連携</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const subStatus = talent.subscription?.status ?? "NONE"
                        const colorClass = STATUS_COLORS[`SUB_${subStatus}`] ?? "bg-gray-100 text-gray-800"
                        return (
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colorClass}`}>
                            {SUBSCRIPTION_STATUS_LABELS[subStatus] ?? "未契約"}
                          </span>
                        )
                      })()}
                    </TableCell>
                    <TableCell>
                      <CompositePdfIconButton talentId={talent.id} photoCount={talent._count.photos} />
                    </TableCell>
                    <TableCell>
                      {talent.resume ? (
                        <a href={blobProxyUrl(talent.resume, true)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline">
                          <ExternalLink className="h-3.5 w-3.5" />
                          表示
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground">未生成</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Link href={`/admin/talents/${talent.id}`}>
                        <Button variant="ghost" size="sm">
                          詳細 <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </Link>
                    </TableCell>
                  </ClickableRow>
                ))
              )}
            </TableBody>
          </Table>
          <Pagination total={totalCount} />
        </CardContent>
      </Card>
    </div>
  )
}
