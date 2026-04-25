import Link from "next/link"
import { getInvoices } from "@/lib/actions/invoice"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const STATUS_OPTIONS = [
  { value: "ALL", label: "すべて" },
  { value: "DRAFT", label: "下書き" },
  { value: "ISSUED", label: "発行済" },
  { value: "SENT", label: "送付済" },
  { value: "PAID", label: "入金済" },
  { value: "CANCELLED", label: "取消" },
]

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  ISSUED: "bg-blue-100 text-blue-800",
  SENT: "bg-yellow-100 text-yellow-800",
  PAID: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "下書き",
  ISSUED: "発行済",
  SENT: "送付済",
  PAID: "入金済",
  CANCELLED: "取消",
}

function formatDate(date: Date | null) {
  if (!date) return "-"
  return new Date(date).toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo" })
}

function formatAmount(amount: number, taxRate: number) {
  const tax = Math.floor(amount * taxRate / 100)
  return `\u00a5${(amount + tax).toLocaleString()}`
}

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams
  const invoices = await getInvoices(status)

  return (
    <div className="space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold">請求書管理</h1>

      <div className="flex gap-2 flex-wrap">
        {STATUS_OPTIONS.map((opt) => {
          const isActive = (status ?? "ALL") === opt.value
          return (
            <Link
              key={opt.value}
              href={opt.value === "ALL" ? "/admin/invoices" : `/admin/invoices?status=${opt.value}`}
              className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground border-primary"
                  : "hover:bg-muted border-border"
              }`}
            >
              {opt.label}
            </Link>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>請求書一覧（{invoices.length}件）</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>請求番号</TableHead>
                <TableHead>案件</TableHead>
                <TableHead className="hidden sm:table-cell">タレント</TableHead>
                <TableHead className="hidden md:table-cell">制作会社</TableHead>
                <TableHead>金額（税込）</TableHead>
                <TableHead className="hidden sm:table-cell">発行日</TableHead>
                <TableHead className="hidden md:table-cell">期日</TableHead>
                <TableHead>ステータス</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    請求書がありません
                  </TableCell>
                </TableRow>
              ) : (
                invoices.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="text-xs font-mono">
                      {inv.freeeInvoiceNumber ?? "-"}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {inv.subject || inv.application.job.title}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {inv.application.talent.name}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Link
                        href={`/admin/production-companies/${inv.productionCompany.id}`}
                        className="hover:underline"
                      >
                        {inv.productionCompany.companyName}
                      </Link>
                    </TableCell>
                    <TableCell>{formatAmount(inv.amount, inv.taxRate)}</TableCell>
                    <TableCell className="hidden sm:table-cell">{formatDate(inv.issueDate)}</TableCell>
                    <TableCell className="hidden md:table-cell">{formatDate(inv.dueDate)}</TableCell>
                    <TableCell>
                      <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${STATUS_COLORS[inv.status] ?? ""}`}>
                        {STATUS_LABELS[inv.status] ?? inv.status}
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
