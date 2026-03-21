import Link from "next/link"
import { getTalents } from "@/lib/actions/talent"
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
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl sm:text-2xl font-bold">タレント管理</h1>
        <LinkButton href="/admin/talents/new">新規登録</LinkButton>
      </div>

      <SearchForm placeholder="名前・フリガナ・メールで検索" defaultValue={q} />

      <Card>
        <CardHeader>
          <CardTitle>タレント一覧（{talents.length}件）</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>名前</TableHead>
                <TableHead className="hidden sm:table-cell">フリガナ</TableHead>
                <TableHead>性別</TableHead>
                <TableHead>年齢</TableHead>
                <TableHead>身長</TableHead>
                <TableHead className="hidden md:table-cell">B/W/H</TableHead>
                <TableHead className="hidden md:table-cell">靴</TableHead>
                <TableHead>ステータス</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {talents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
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
                      <p className="text-xs text-muted-foreground sm:hidden">{talent.nameKana}</p>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{talent.nameKana}</TableCell>
                    <TableCell>
                      {talent.gender ? GENDER_LABELS[talent.gender] : "−"}
                    </TableCell>
                    <TableCell>
                      {talent.birthDate ? `${calcAge(talent.birthDate)}歳` : "−"}
                    </TableCell>
                    <TableCell>
                      {talent.height ? `${talent.height}cm` : "−"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {talent.bust || talent.waist || talent.hip
                        ? `${talent.bust ?? "−"}/${talent.waist ?? "−"}/${talent.hip ?? "−"}`
                        : "−"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {talent.shoeSize ? `${talent.shoeSize}cm` : "−"}
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
