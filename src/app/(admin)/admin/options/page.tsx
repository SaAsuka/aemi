import Link from "next/link"
import { getOptions, getOptionCount } from "@/lib/actions/option"
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
import { OPTION_STATUS_LABELS, OPTION_CATEGORY_LABELS } from "@/types"
import { SearchForm } from "@/components/admin/search-form"
import { StatusFilter } from "@/components/admin/status-filter"
import { Pagination } from "@/components/admin/pagination"
import { formatDeadline } from "@/lib/utils/date"

export default async function OptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>
}) {
  const { q, status, page } = await searchParams
  const [options, totalCount] = await Promise.all([
    getOptions(q, status, page ? Number(page) : 1),
    getOptionCount(q, status),
  ])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl sm:text-2xl font-bold">オプション管理</h1>
        <LinkButton href="/admin/options/new">新規作成</LinkButton>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <SearchForm placeholder="オプション名で検索" defaultValue={q} />
        <StatusFilter
          options={[
            { value: "ALL", label: "すべて" },
            { value: "DRAFT", label: "下書き" },
            { value: "ACTIVE", label: "公開中" },
            { value: "CLOSED", label: "終了" },
          ]}
          defaultValue={status}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>オプション一覧（{totalCount}件）</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>オプション名</TableHead>
                <TableHead>カテゴリ</TableHead>
                <TableHead>価格</TableHead>
                <TableHead className="hidden sm:table-cell">締切</TableHead>
                <TableHead>購入数</TableHead>
                <TableHead>ステータス</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {options.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    データがありません
                  </TableCell>
                </TableRow>
              ) : (
                options.map((opt) => (
                  <TableRow key={opt.id}>
                    <TableCell>
                      <Link
                        href={`/admin/options/${opt.id}`}
                        className="font-medium hover:underline"
                      >
                        {opt.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        status={opt.category}
                        label={OPTION_CATEGORY_LABELS[opt.category]}
                      />
                    </TableCell>
                    <TableCell>{`¥${opt.price.toLocaleString()}`}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {opt.deadline ? formatDeadline(opt.deadline) : "−"}
                    </TableCell>
                    <TableCell>{opt._count.purchases}件</TableCell>
                    <TableCell>
                      <StatusBadge
                        status={opt.status}
                        label={OPTION_STATUS_LABELS[opt.status]}
                      />
                    </TableCell>
                    <TableCell>
                      <LinkButton href={`/admin/options/${opt.id}`} size="sm" variant="outline">
                        詳細
                      </LinkButton>
                    </TableCell>
                  </TableRow>
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
