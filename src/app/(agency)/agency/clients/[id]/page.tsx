import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { requireAgencyAdmin } from "@/lib/agency-auth"
import { getAgencyClient } from "@/lib/actions/agency-client"
import { AgencyDeleteButton } from "@/components/agency/agency-delete-button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AgencyClientForm } from "@/components/agency/agency-client-form"
import { StatusBadge } from "@/components/admin/status-badge"
import { JOB_STATUS_LABELS } from "@/types"

export default async function AgencyClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const agency = await requireAgencyAdmin()
  const client = await getAgencyClient(id, agency.id)

  if (!client) notFound()

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <Link href="/agency/clients" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-bold">{client.companyName}</h1>
        </div>
        <AgencyDeleteButton id={client.id} type="client" redirectTo="/agency/clients" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>クライアント情報</CardTitle>
        </CardHeader>
        <CardContent>
          <AgencyClientForm client={client} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>案件一覧（{client.jobs.length}件）</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>案件名</TableHead>
                <TableHead>ステータス</TableHead>
                <TableHead>応募数</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {client.jobs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">案件がありません</TableCell>
                </TableRow>
              ) : (
                client.jobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell>
                      <Link href={`/agency/jobs/${job.id}`} className="hover:underline">
                        {job.title}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={job.status} label={JOB_STATUS_LABELS[job.status]} />
                    </TableCell>
                    <TableCell>{job._count.applications}件</TableCell>
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
