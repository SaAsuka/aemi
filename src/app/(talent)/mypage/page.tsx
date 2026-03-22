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
import { Camera, Briefcase, Film, FileText, User } from "lucide-react"

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
        {/* コンパクトヘッダー */}
        <section className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <h1 className="text-xl font-bold truncate">{displayName}</h1>
            {talent.category && (
              <span className="text-sm text-primary shrink-0">{talent.category}</span>
            )}
          </div>
          <TalentEditSheet talent={talent} />
        </section>

        {/* 応募状況 */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">応募状況</h2>
          </div>
          <TalentApplicationHistory applications={talent.applications} />
        </section>

        {/* マイプロフィール（折りたたみ） */}
        <details className="group">
          <summary className="flex items-center gap-2 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
            <User className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">マイプロフィール</h2>
            <svg
              className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180 ml-1"
              xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </summary>

          <div className="mt-4 space-y-10">
            {/* 基本情報 */}
            <div className="rounded-xl bg-muted/50 p-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2 text-sm">
                {talent.stageName && (
                  <div>
                    <span className="text-xs text-muted-foreground block">本名</span>
                    {talent.name}
                  </div>
                )}
                {talent.nameRomaji && (
                  <div>
                    <span className="text-xs text-muted-foreground block">ローマ字</span>
                    {talent.nameRomaji}
                  </div>
                )}
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
          </div>
        </details>
      </div>
    </>
  )
}
