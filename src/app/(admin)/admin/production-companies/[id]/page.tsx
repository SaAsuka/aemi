import { notFound } from "next/navigation"
import Link from "next/link"
import { getProductionCompany } from "@/lib/actions/production-company"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ProductionCompanyForm } from "@/components/admin/production-company-form"
import { DeleteButton } from "@/components/admin/delete-button"
import { Badge } from "@/components/ui/badge"

const INVOICE_STATUS_LABELS: Record<string, string> = {
  DRAFT: "下書き",
  ISSUED: "発行済",
  SENT: "送付済",
  PAID: "入金済",
  CANCELLED: "取消",
}

const INVOICE_STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  ISSUED: "bg-blue-100 text-blue-800",
  SENT: "bg-yellow-100 text-yellow-800",
  PAID: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
}

function formatDate(date: Date | null) {
  if (!date) return "-"
  return new Date(date).toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo" })
}

function formatAmount(amount: number) {
  return `\u00a5${amount.toLocaleString()}`
}

export default async function ProductionCompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const company = await getProductionCompany(id)

  if (!company) notFound()

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl sm:text-2xl font-bold">{company.companyName}</h1>
        <DeleteButton id={company.id} type="production-company" />
      </div>

      {company.freeePartnerId && (
        <Badge variant="outline" className="text-green-700 border-green-300">
          Freee連携済（パートナーID: {company.freeePartnerId}）
        </Badge>
      )}

      <Card>
        <CardHeader>
          <CardTitle>基本情報</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductionCompanyForm company={company} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>請求書一覧（{company.invoices.length}件）</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>件名</TableHead>
                <TableHead className="hidden sm:table-cell">タレント</TableHead>
                <TableHead>金額</TableHead>
                <TableHead className="hidden sm:table-cell">発行日</TableHead>
                <TableHead>ステータス</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {company.invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    請求書がありません
                  </TableCell>
                </TableRow>
              ) : (
                company.invoices.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell>
                      <Link
                        href={`/admin/invoices`}
                        className="hover:underline"
                      >
                        {inv.subject || inv.application.job.title}
                      </Link>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{inv.application.talent.name}</TableCell>
                    <TableCell>{formatAmount(inv.amount)}</TableCell>
                    <TableCell className="hidden sm:table-cell">{formatDate(inv.issueDate)}</TableCell>
                    <TableCell>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${INVOICE_STATUS_COLORS[inv.status] ?? ""}`}>
                        {INVOICE_STATUS_LABELS[inv.status] ?? inv.status}
                      </span>
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
