import Link from "next/link"
import { getTalents } from "@/lib/actions/talent"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { StatusBadge } from "@/components/admin/status-badge"
import { TALENT_STATUS_LABELS, GENDER_LABELS } from "@/types"
import { calcAge } from "@/lib/utils/date"
import { SearchForm } from "@/components/admin/search-form"

export default async function TalentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const talents = await getTalents(q)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">タレント管理</h1>
        <Link href="/admin/talents/new" className={buttonVariants()}>新規登録</Link>
      </div>

      <SearchForm placeholder="名前・フリガナ・メールで検索" defaultValue={q} />

      <Card>
        <CardHeader>
          <CardTitle>タレント一覧（{talents.length}件）</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>名前</TableHead>
                <TableHead>フリガナ</TableHead>
                <TableHead>性別</TableHead>
                <TableHead>年齢</TableHead>
                <TableHead>身長</TableHead>
                <TableHead>ステータス</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {talents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    データがありません
                  </TableCell>
                </TableRow>
              ) : (
                talents.map((talent) => (
                  <TableRow key={talent.id}>
                    <TableCell>
                      <Link
                        href={`/admin/talents/${talent.id}`}
                        className="font-medium hover:underline"
                      >
                        {talent.name}
                      </Link>
                    </TableCell>
                    <TableCell>{talent.nameKana}</TableCell>
                    <TableCell>
                      {talent.gender ? GENDER_LABELS[talent.gender] : "−"}
                    </TableCell>
                    <TableCell>
                      {talent.birthDate ? `${calcAge(talent.birthDate)}歳` : "−"}
                    </TableCell>
                    <TableCell>
                      {talent.height ? `${talent.height}cm` : "−"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        status={talent.status}
                        label={TALENT_STATUS_LABELS[talent.status]}
                      />
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
