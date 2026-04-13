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
import { TalentEditSheet } from "@/components/admin/talent-edit-sheet"
import { DeleteButton } from "@/components/admin/delete-button"
import { StatusBadge } from "@/components/admin/status-badge"
import { CompositePdfButton } from "@/components/admin/composite-pdf-button"
import { SetPasswordDialog } from "@/components/admin/set-password-dialog"
import { TalentPhotos } from "@/components/admin/talent-photos"
import { TalentWorks } from "@/components/admin/talent-works"
import { APPLICATION_STATUS_LABELS, TALENT_STATUS_LABELS, SUBSCRIPTION_STATUS_LABELS, STATUS_COLORS } from "@/types"
import { formatDate, calcAge } from "@/lib/utils/date"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default async function TalentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  let talent
  try {
    talent = await getTalent(id)
  } catch (e) {
    console.error(`[TalentDetail] getTalent failed id=${id}`, e instanceof Error ? e.message : e)
    throw e
  }

  if (!talent) notFound()

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <Link href="/admin/talents">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold">{talent.name}</h1>
        </div>
        <div className="flex items-center gap-2">
          <TalentEditSheet talent={talent} />
          <SetPasswordDialog talentId={talent.id} talentName={talent.name} />
          <CompositePdfButton talentId={talent.id} resumeUrl={talent.resume} resumeSource={talent.resumeSource} photoCount={talent.photos.length} />
          <DeleteButton id={talent.id} type="talent" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border p-3 text-center">
          <p className="text-xs text-muted-foreground">ステータス</p>
          <StatusBadge status={talent.status} label={TALENT_STATUS_LABELS[talent.status]} />
        </div>
        <div className="rounded-lg border p-3 text-center">
          <p className="text-xs text-muted-foreground">LINE連携</p>
          <p className={`text-sm font-medium ${talent.lineUserId ? "text-green-700" : "text-gray-500"}`}>
            {talent.lineUserId ? "連携済" : "未連携"}
          </p>
        </div>
        <div className="rounded-lg border p-3 text-center">
          <p className="text-xs text-muted-foreground">サブスク</p>
          <p className="text-sm font-medium">
            {SUBSCRIPTION_STATUS_LABELS[talent.subscription?.status ?? "NONE"] ?? "未契約"}
          </p>
        </div>
        <div className="rounded-lg border p-3 text-center">
          <p className="text-xs text-muted-foreground">登録日</p>
          <p className="text-sm font-medium">{formatDate(talent.createdAt)}</p>
        </div>
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
            {talent.nameRomaji && (
              <div>
                <dt className="text-muted-foreground">ローマ字</dt>
                <dd className="font-medium">{talent.nameRomaji}</dd>
              </div>
            )}
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
            {talent.category && (
              <div>
                <dt className="text-muted-foreground">カテゴリ</dt>
                <dd className="font-medium">{talent.category}</dd>
              </div>
            )}
            {talent.birthplace && (
              <div>
                <dt className="text-muted-foreground">出身地</dt>
                <dd className="font-medium">{talent.birthplace}</dd>
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
            {talent.qualifications && (
              <div className="col-span-2">
                <dt className="text-muted-foreground">資格</dt>
                <dd className="font-medium">{talent.qualifications}</dd>
              </div>
            )}
          </dl>
          {talent.career && (
            <div className="mt-4 text-sm">
              <p className="text-muted-foreground mb-1">経歴</p>
              <p className="whitespace-pre-wrap">{talent.career}</p>
            </div>
          )}
          {talent.representativeWork && (
            <div className="mt-4 text-sm">
              <p className="text-muted-foreground mb-1">代表作</p>
              <p className="whitespace-pre-wrap">{talent.representativeWork}</p>
            </div>
          )}
          {talent.socialLinks.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-3 text-sm">
              {talent.socialLinks.map((link) => (
                <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  {link.platform === "INSTAGRAM" ? "Instagram" : link.platform === "X" ? "X" : link.platform === "TIKTOK" ? "TikTok" : "公式HP"}
                </a>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>宣材写真（{talent.photos.length}枚）</CardTitle>
        </CardHeader>
        <CardContent>
          <TalentPhotos talentId={talent.id} photos={talent.photos} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>過去出演写真（{talent.works.length}件）</CardTitle>
        </CardHeader>
        <CardContent>
          <TalentWorks talentId={talent.id} works={talent.works} />
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
                <TableHead>ステータス</TableHead>
                <TableHead>応募日</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {talent.applications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
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
