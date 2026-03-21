import { notFound } from "next/navigation"
import Link from "next/link"
import { getTalent } from "@/lib/actions/talent"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { formatDate, calcAge } from "@/lib/utils/date"

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
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl sm:text-2xl font-bold">{talent.name}</h1>
        <DeleteButton id={talent.id} type="talent" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>プロフィール</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-x-4 gap-y-2 text-sm sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            <div>
              <dt className="text-muted-foreground">フリガナ</dt>
              <dd className="font-medium">{talent.nameKana}</dd>
            </div>
            {talent.gender && (
              <div>
                <dt className="text-muted-foreground">性別</dt>
                <dd className="font-medium">{talent.gender === "MALE" ? "男性" : talent.gender === "FEMALE" ? "女性" : "その他"}</dd>
              </div>
            )}
            {talent.birthDate && (
              <div>
                <dt className="text-muted-foreground">年齢</dt>
                <dd className="font-medium">{calcAge(talent.birthDate)}歳</dd>
              </div>
            )}
            {talent.height && (
              <div>
                <dt className="text-muted-foreground">身長</dt>
                <dd className="font-medium">{talent.height}cm</dd>
              </div>
            )}
            {(talent.bust || talent.waist || talent.hip) && (
              <div>
                <dt className="text-muted-foreground">B/W/H</dt>
                <dd className="font-medium">
                  {talent.bust ?? "−"}/{talent.waist ?? "−"}/{talent.hip ?? "−"}
                </dd>
              </div>
            )}
            {talent.shoeSize && (
              <div>
                <dt className="text-muted-foreground">靴サイズ</dt>
                <dd className="font-medium">{talent.shoeSize}cm</dd>
              </div>
            )}
            {talent.skills && (
              <div className="col-span-2">
                <dt className="text-muted-foreground">特技</dt>
                <dd className="font-medium">{talent.skills}</dd>
              </div>
            )}
            {talent.hobbies && (
              <div className="col-span-2">
                <dt className="text-muted-foreground">趣味</dt>
                <dd className="font-medium">{talent.hobbies}</dd>
              </div>
            )}
          </dl>
          {talent.career && (
            <div className="mt-4 text-sm">
              <p className="text-muted-foreground mb-1">経歴</p>
              <p className="whitespace-pre-wrap">{talent.career}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>基本情報 編集</CardTitle>
        </CardHeader>
        <CardContent>
          <TalentForm talent={talent} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>応募履歴（{talent.applications.length}件）</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>案件名</TableHead>
                <TableHead className="hidden sm:table-cell">クライアント</TableHead>
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
                      <p className="text-xs text-muted-foreground sm:hidden">{app.job.client.companyName}</p>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{app.job.client.companyName}</TableCell>
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
