import { notFound } from "next/navigation"
import Link from "next/link"
import { getClient } from "@/lib/actions/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ClientForm } from "@/components/admin/client-form"
import { DeleteButton } from "@/components/admin/delete-button"
import { StatusBadge } from "@/components/admin/status-badge"
import { JOB_STATUS_LABELS } from "@/types"

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const client = await getClient(id)

  if (!client) notFound()

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl sm:text-2xl font-bold">{client.companyName}</h1>
        <DeleteButton id={client.id} type="client" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>基本情報</CardTitle>
        </CardHeader>
        <CardContent>
          <ClientForm client={client} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>案件一覧（{client.jobs.length}件）</CardTitle>
        </CardHeader>
        <CardContent>
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
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    案件がありません
                  </TableCell>
                </TableRow>
              ) : (
                client.jobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell>
                      <Link
                        href={`/admin/jobs/${job.id}`}
                        className="hover:underline"
                      >
                        {job.title}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        status={job.status}
                        label={JOB_STATUS_LABELS[job.status]}
                      />
                    </TableCell>
                    <TableCell>{job._count.applications}</TableCell>
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
