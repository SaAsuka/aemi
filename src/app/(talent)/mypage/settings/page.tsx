import { requireTalent } from "@/lib/auth"
import { getTalent } from "@/lib/actions/talent"
import { redirect } from "next/navigation"
import { TalentNav } from "@/components/talent-nav"
import { TalentForm } from "@/components/admin/talent-form"
import { TalentPhotos } from "@/components/admin/talent-photos"
import { TalentWorks } from "@/components/admin/talent-works"
import { CompositePdfButton } from "@/components/admin/composite-pdf-button"
import { updateMyProfile } from "@/lib/actions/talent-mypage"
import { ChangePasswordForm } from "@/components/change-password-form"
import { Camera, Film, FileText, Lock } from "lucide-react"

export default async function SettingsPage() {
  const session = await requireTalent()
  const talent = await getTalent(session.id)
  if (!talent) redirect("/auth/login")

  const displayName = talent.stageName || talent.name

  return (
    <>
      <TalentNav talentName={displayName} />
      <div className="mx-auto max-w-2xl px-4 py-8 space-y-10">
        <h1 className="text-xl font-bold">設定</h1>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">プロフィール編集</h2>
          <TalentForm talent={talent} mode="talent" customAction={updateMyProfile} />
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">パスワード変更</h2>
          </div>
          <ChangePasswordForm />
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">宣材写真</h2>
          </div>
          <TalentPhotos talentId={talent.id} photos={talent.photos} />
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Film className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">過去作品</h2>
          </div>
          <TalentWorks talentId={talent.id} works={talent.works} />
        </section>

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
    </>
  )
}
