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
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl sm:text-2xl font-bold">クライアント管理</h1>
        <LinkButton href="/admin/clients/new">新規登録</LinkButton>
      </div>

      <SearchForm placeholder="会社名・担当者名で検索" defaultValue={q} />

      <Card>
        <CardHeader>
          <CardTitle>クライアント一覧（{clients.length}件）</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>会社名</TableHead>
                <TableHead className="hidden sm:table-cell">担当者</TableHead>
                <TableHead className="hidden md:table-cell">メール</TableHead>
                <TableHead className="hidden md:table-cell">電話番号</TableHead>
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
                      {client.contactName && (
                        <p className="text-xs text-muted-foreground sm:hidden">{client.contactName}</p>
                      )}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{client.contactName ?? "−"}</TableCell>
                    <TableCell className="hidden md:table-cell">{client.contactEmail ?? "−"}</TableCell>
                    <TableCell className="hidden md:table-cell">{client.contactPhone ?? "−"}</TableCell>
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
