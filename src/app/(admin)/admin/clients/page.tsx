import Link from "next/link"
import { getClients } from "@/lib/actions/client"
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

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const clients = await getClients(q)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">クライアント管理</h1>
        <LinkButton href="/admin/clients/new">新規登録</LinkButton>
      </div>

      <SearchForm placeholder="会社名・担当者名で検索" defaultValue={q} />

      <Card>
        <CardHeader>
          <CardTitle>クライアント一覧（{clients.length}件）</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>会社名</TableHead>
                <TableHead>担当者</TableHead>
                <TableHead>メール</TableHead>
                <TableHead>電話番号</TableHead>
                <TableHead>案件数</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    データがありません
                  </TableCell>
                </TableRow>
              ) : (
                clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell>
                      <Link
                        href={`/admin/clients/${client.id}`}
                        className="font-medium hover:underline"
                      >
                        {client.companyName}
                      </Link>
                    </TableCell>
                    <TableCell>{client.contactName ?? "−"}</TableCell>
                    <TableCell>{client.contactEmail ?? "−"}</TableCell>
                    <TableCell>{client.contactPhone ?? "−"}</TableCell>
                    <TableCell>{client._count.jobs}</TableCell>
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
