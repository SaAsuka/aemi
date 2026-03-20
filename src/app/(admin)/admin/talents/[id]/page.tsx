import { notFound } from "next/navigation"
import Link from "next/link"
import { getTalent } from "@/lib/actions/talent"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { TalentForm } from "@/components/admin/talent-form"
import { DeleteButton } from "@/components/admin/delete-button"
import { StatusBadge } from "@/components/admin/status-badge"
import { APPLICATION_STATUS_LABELS } from "@/types"
import { formatDate } from "@/lib/utils/date"

export default async function TalentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const talent = await getTalent(id)

  if (!talent) notFound()

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{talent.name}</h1>
        <DeleteButton id={talent.id} type="talent" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>基本情報</CardTitle>
        </CardHeader>
        <CardContent>
          <TalentForm talent={talent} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>応募履歴（{talent.applications.length}件）</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>案件名</TableHead>
                <TableHead>クライアント</TableHead>
                <TableHead>ステータス</TableHead>
                <TableHead>応募日</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {talent.applications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    応募履歴がありません
                  </TableCell>
                </TableRow>
              ) : (
                talent.applications.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell>
                      <Link
                        href={`/admin/jobs/${app.job.id}`}
                        className="hover:underline"
                      >
                        {app.job.title}
                      </Link>
                    </TableCell>
                    <TableCell>{app.job.client.companyName}</TableCell>
                    <TableCell>
                      <StatusBadge
                        status={app.status}
                        label={APPLICATION_STATUS_LABELS[app.status]}
                      />
                    </TableCell>
                    <TableCell>{formatDate(app.appliedAt)}</TableCell>
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
