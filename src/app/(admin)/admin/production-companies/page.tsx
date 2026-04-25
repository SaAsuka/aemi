import Link from "next/link"
import { getProductionCompanies } from "@/lib/actions/production-company"
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
import { SearchForm } from "@/components/admin/search-form"
import { Badge } from "@/components/ui/badge"
import { FreeeSyncButton } from "@/components/admin/freee-sync-button"

export default async function ProductionCompaniesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const companies = await getProductionCompanies(q)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl sm:text-2xl font-bold">制作会社管理</h1>
        <div className="flex items-center gap-2">
          <FreeeSyncButton />
          <LinkButton href="/admin/production-companies/new">新規登録</LinkButton>
        </div>
      </div>

      <SearchForm placeholder="会社名・担当者名で検索" defaultValue={q} />

      <Card>
        <CardHeader>
          <CardTitle>制作会社一覧（{companies.length}件）</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>会社名</TableHead>
                <TableHead className="hidden sm:table-cell">担当者</TableHead>
                <TableHead className="hidden md:table-cell">メール</TableHead>
                <TableHead className="hidden md:table-cell">Freee</TableHead>
                <TableHead>請求書数</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {companies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    データがありません
                  </TableCell>
                </TableRow>
              ) : (
                companies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell>
                      <Link
                        href={`/admin/production-companies/${company.id}`}
                        className="font-medium hover:underline"
                      >
                        {company.companyName}
                      </Link>
                      {company.contactName && (
                        <p className="text-xs text-muted-foreground sm:hidden">{company.contactName}</p>
                      )}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{company.contactName ?? "-"}</TableCell>
                    <TableCell className="hidden md:table-cell">{company.contactEmail ?? "-"}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      {company.freeePartnerId ? (
                        <Badge variant="outline" className="text-green-700 border-green-300">連携済</Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">未連携</span>
                      )}
                    </TableCell>
                    <TableCell>{company._count.invoices}</TableCell>
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
