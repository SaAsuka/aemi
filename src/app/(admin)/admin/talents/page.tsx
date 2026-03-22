import Link from "next/link"
import { blobProxyUrl } from "@/lib/utils/blob"
import { getTalents } from "@/lib/actions/talent"
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
import { TALENT_STATUS_LABELS } from "@/types"
import { SearchForm } from "@/components/admin/search-form"
import { TalentFilters } from "@/components/admin/talent-filters"
import { JobLinkCopyButton } from "@/components/admin/job-link-copy-button"
import { CompositePdfIconButton } from "@/components/admin/composite-pdf-button"
import { ExternalLink, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { RegisterLinkCopy } from "@/components/admin/register-link-copy"
import { InviteTalentButton } from "@/components/admin/invite-talent-button"

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
  const talents = await getTalents({
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
  })
  const hasFilters = Object.keys(params).some((k) => k !== "q" && params[k as keyof TalentSearchParams])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl sm:text-2xl font-bold">タレント管理</h1>
        <div className="flex items-center gap-2">
          <InviteTalentButton />
          <RegisterLinkCopy />
          <LinkButton href="/admin/talents/new">新規登録</LinkButton>
        </div>
      </div>

      <SearchForm placeholder="名前・フリガナ・メールで検索" defaultValue={params.q} />

      <TalentFilters />

      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-primary text-lg">タレント一覧<span className="ml-2 text-sm font-normal text-muted-foreground">({talents.length}件){hasFilters && " フィルタ中"}</span></CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto px-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/60 hover:bg-muted/60">
                <TableHead>名前</TableHead>
                <TableHead className="hidden sm:table-cell">フリガナ</TableHead>
                <TableHead>ステータス</TableHead>
                <TableHead>コンポジ生成</TableHead>
                <TableHead>コンポジPDF</TableHead>
                <TableHead>案件リンク</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {talents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    データがありません
                  </TableCell>
                </TableRow>
              ) : (
                talents.map((talent, i) => (
                  <TableRow key={talent.id} className={i % 2 === 1 ? "bg-muted/30" : ""}>
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
                      {talent.accessToken && (
                        <JobLinkCopyButton accessToken={talent.accessToken} />
                      )}
                    </TableCell>
                    <TableCell>
                      <Link href={`/admin/talents/${talent.id}`}>
                        <Button variant="ghost" size="sm">
                          詳細 <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
