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
import { Camera, Briefcase, FileText, Film } from "lucide-react"

export default async function MyPage() {
  const session = await requireTalent()
  const talent = await getTalent(session.id)
  if (!talent) redirect("/auth/login")

  const displayName = talent.stageName || talent.name
  const genderLabel = talent.gender ? GENDER_LABELS[talent.gender] : null
  const birthDateStr = talent.birthDate
    ? new Date(talent.birthDate).toLocaleDateString("ja-JP")
    : null

  const sizeStr = [
    talent.bust && `B${talent.bust}`,
    talent.waist && `W${talent.waist}`,
    talent.hip && `H${talent.hip}`,
  ].filter(Boolean).join(" / ")

  return (
    <>
      <TalentNav talentName={displayName} />
      <div className="mx-auto max-w-2xl px-4 py-8 space-y-10">
        {/* プロフィールヘッダー */}
        <section>
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">{displayName}</h1>
              {talent.stageName && (
                <p className="text-sm text-muted-foreground mt-0.5">本名: {talent.name}</p>
              )}
              {talent.nameRomaji && (
                <p className="text-xs text-muted-foreground tracking-wider mt-0.5">{talent.nameRomaji}</p>
              )}
              {talent.category && (
                <p className="text-sm text-primary mt-1">{talent.category}</p>
              )}
            </div>
            <TalentEditSheet talent={talent} />
          </div>
          <div className="rounded-xl bg-muted/50 p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2 text-sm">
              {genderLabel && (
                <div>
                  <span className="text-xs text-muted-foreground block">性別</span>
                  {genderLabel}
                </div>
              )}
              {birthDateStr && (
                <div>
                  <span className="text-xs text-muted-foreground block">生年月日</span>
                  {birthDateStr}
                </div>
              )}
              {talent.height && (
                <div>
                  <span className="text-xs text-muted-foreground block">身長</span>
                  {talent.height}cm
                </div>
              )}
              {sizeStr && (
                <div>
                  <span className="text-xs text-muted-foreground block">サイズ</span>
                  {sizeStr}
                </div>
              )}
              {talent.birthplace && (
                <div>
                  <span className="text-xs text-muted-foreground block">出身地</span>
                  {talent.birthplace}
                </div>
              )}
              {talent.shoeSize && (
                <div>
                  <span className="text-xs text-muted-foreground block">靴サイズ</span>
                  {talent.shoeSize}cm
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 宣材写真 */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">宣材写真</h2>
          </div>
          <TalentPhotos talentId={talent.id} photos={talent.photos} />
        </section>

        {/* 過去作品 */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Film className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">過去作品</h2>
          </div>
          <TalentWorks talentId={talent.id} works={talent.works} />
        </section>

        {/* コンポジPDF */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">コンポジPDF</h2>
          </div>
          <CompositePdfButton
            talentId={talent.id}
            resumeUrl={talent.resume}
            photoCount={talent.photos.length}
          />
        </section>

        {/* 応募履歴 */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">応募履歴</h2>
          </div>
          <TalentApplicationHistory applications={talent.applications} />
        </section>
      </div>
    </>
  )
}
