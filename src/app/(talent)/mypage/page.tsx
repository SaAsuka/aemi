import { requireTalent } from "@/lib/auth"
import { getTalent } from "@/lib/actions/talent"
import { redirect } from "next/navigation"
import { TalentNav } from "@/components/talent-nav"
import { TalentEditSheet } from "@/components/talent-edit-sheet"
import { TalentPhotos } from "@/components/admin/talent-photos"
import { TalentWorks } from "@/components/admin/talent-works"
import { CompositePdfButton } from "@/components/admin/composite-pdf-button"
import { TalentApplicationHistory } from "@/components/talent-application-history"
import { GENDER_LABELS } from "@/types"
import { Separator } from "@/components/ui/separator"

export default async function MyPage() {
  const session = await requireTalent()
  const talent = await getTalent(session.id)
  if (!talent) redirect("/auth/login")

  const genderLabel = talent.gender ? GENDER_LABELS[talent.gender] : null
  const birthDateStr = talent.birthDate
    ? new Date(talent.birthDate).toLocaleDateString("ja-JP")
    : null

  return (
    <>
      <TalentNav talentName={talent.name} />
      <div className="mx-auto max-w-2xl px-4 py-8 space-y-8">
        {/* プロフィール概要 */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">プロフィール</h2>
            <TalentEditSheet talent={talent} />
          </div>
          <div className="rounded-lg border p-4 space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-muted-foreground">名前: </span>
                {talent.name}
              </div>
              <div>
                <span className="text-muted-foreground">フリガナ: </span>
                {talent.nameKana}
              </div>
              {talent.email && (
                <div>
                  <span className="text-muted-foreground">メール: </span>
                  {talent.email}
                </div>
              )}
              {talent.phone && (
                <div>
                  <span className="text-muted-foreground">電話: </span>
                  {talent.phone}
                </div>
              )}
              {genderLabel && (
                <div>
                  <span className="text-muted-foreground">性別: </span>
                  {genderLabel}
                </div>
              )}
              {birthDateStr && (
                <div>
                  <span className="text-muted-foreground">生年月日: </span>
                  {birthDateStr}
                </div>
              )}
              {talent.height && (
                <div>
                  <span className="text-muted-foreground">身長: </span>
                  {talent.height}cm
                </div>
              )}
              {talent.category && (
                <div>
                  <span className="text-muted-foreground">カテゴリ: </span>
                  {talent.category}
                </div>
              )}
            </div>
          </div>
        </section>

        <Separator />

        {/* 宣材写真 */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold">宣材写真</h2>
          <TalentPhotos talentId={talent.id} photos={talent.photos} />
        </section>

        <Separator />

        {/* 過去作品 */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold">過去作品</h2>
          <TalentWorks talentId={talent.id} works={talent.works} />
        </section>

        <Separator />

        {/* コンポジPDF */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold">コンポジPDF</h2>
          <CompositePdfButton
            talentId={talent.id}
            resumeUrl={talent.resume}
            photoCount={talent.photos.length}
          />
        </section>

        <Separator />

        {/* 応募履歴 */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold">応募履歴</h2>
          <TalentApplicationHistory applications={talent.applications} />
        </section>
      </div>
    </>
  )
}
