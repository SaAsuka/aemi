import Link from "next/link"
import { requireAgencyAdmin } from "@/lib/agency-auth"
import { getAgencyClients } from "@/lib/actions/agency-client"
import { LinkButton } from "@/components/admin/link-button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { SearchForm } from "@/components/admin/search-form"
import { Building2 } from "lucide-react"

export default async function AgencyClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const agency = await requireAgencyAdmin()
  const { q } = await searchParams
  const clients = await getAgencyClients(agency.id, q)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl sm:text-2xl font-bold">クライアント管理</h1>
        <LinkButton href="/agency/clients/new">新規登録</LinkButton>
      </div>

      <SearchForm placeholder="会社名・担当者名で検索" defaultValue={q} />

      <Card>
        <CardHeader>
          <CardTitle>クライアント一覧（{clients.length}件）</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {clients.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              <Building2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">クライアントがいません</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>会社名</TableHead>
                  <TableHead className="hidden sm:table-cell">担当者</TableHead>
                  <TableHead className="hidden md:table-cell">メール</TableHead>
                  <TableHead>案件数</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">
                      <Link href={`/agency/clients/${client.id}`} className="hover:underline">
                        {client.companyName}
                      </Link>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">
                      {client.contactName ?? "−"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {client.contactEmail ?? "−"}
                    </TableCell>
                    <TableCell>{client._count.jobs}件</TableCell>
                    <TableCell>
                      <LinkButton href={`/agency/clients/${client.id}`} size="sm" variant="outline">
                        詳細
                      </LinkButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
