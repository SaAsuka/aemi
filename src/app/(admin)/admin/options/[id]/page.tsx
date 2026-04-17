import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { getOption } from "@/lib/actions/option"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { OptionForm } from "@/components/admin/option-form"
import { DeleteButton } from "@/components/admin/delete-button"
import { StatusBadge } from "@/components/admin/status-badge"
import { OPTION_PURCHASE_STATUS_LABELS } from "@/types"
import { formatDate } from "@/lib/utils/date"
import type { OptionPurchaseStatus } from "@/generated/prisma/client"

type Purchase = {
  id: string
  status: OptionPurchaseStatus
  paidAt: Date | null
  createdAt: Date
  talent: { id: string; name: string }
}

export default async function OptionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const option = await getOption(id)

  if (!option) notFound()

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <Link href="/admin/options" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold">{option.name}</h1>
        </div>
        <DeleteButton id={option.id} type="option" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>オプション情報</CardTitle>
        </CardHeader>
        <CardContent>
          <OptionForm option={option} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>購入履歴（{option.purchases.length}件）</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>タレント名</TableHead>
                <TableHead>ステータス</TableHead>
                <TableHead>支払日</TableHead>
                <TableHead>申込日</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {option.purchases.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    購入履歴がありません
                  </TableCell>
                </TableRow>
              ) : (
                (option.purchases as Purchase[]).map((purchase) => (
                  <TableRow key={purchase.id}>
                    <TableCell>
                      <Link
                        href={`/admin/talents/${purchase.talent.id}`}
                        className="hover:underline"
                      >
                        {purchase.talent.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        status={purchase.status}
                        label={OPTION_PURCHASE_STATUS_LABELS[purchase.status]}
                      />
                    </TableCell>
                    <TableCell>
                      {purchase.paidAt ? formatDate(purchase.paidAt) : "−"}
                    </TableCell>
                    <TableCell>{formatDate(purchase.createdAt)}</TableCell>
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
