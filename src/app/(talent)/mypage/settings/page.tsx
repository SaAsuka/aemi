import { requireTalentRaw } from "@/lib/auth"
import { getTalentForSettings } from "@/lib/actions/talent"
import { redirect } from "next/navigation"
import { TalentNav } from "@/components/talent-nav"
import { TalentForm } from "@/components/admin/talent-form"
import { TalentPhotos } from "@/components/admin/talent-photos"
import { TalentWorks } from "@/components/admin/talent-works"
import { CompositePdfButton } from "@/components/admin/composite-pdf-button"
import { updateMyProfile } from "@/lib/actions/talent-mypage"
import { ChangePasswordForm } from "@/components/change-password-form"
import { Camera, Film, FileText, Lock, AlertTriangle, MessageCircle } from "lucide-react"
import { LineConnectSection } from "@/components/line-connect-section"

export default async function SettingsPage() {
  const session = await requireTalentRaw()
  if (session.nameKana === "未設定") redirect("/setup")
  const talent = await getTalentForSettings(session.id)
  if (!talent) redirect("/auth/login")

  const displayName = talent.stageName || session.name

  return (
    <>
      <TalentNav talentName={displayName} />
      <div className="mx-auto max-w-4xl px-4 py-8 space-y-10">
        <h1 className="text-xl font-bold">設定</h1>

        {session.mustChangePassword && (
          <div className="flex items-center gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4">
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
            <p className="text-sm text-amber-800">
              初期パスワードが設定されています。セキュリティのため、パスワードを変更してください。
            </p>
          </div>
        )}

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">プロフィール編集</h2>
          <TalentForm talent={talent} mode="talent" customAction={updateMyProfile} />
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">パスワード変更</h2>
          </div>
          <ChangePasswordForm mustChangePassword={session.mustChangePassword} />
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">LINE通知</h2>
          </div>
          <LineConnectSection connected={!!talent.lineUserId} />
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
            resumeSource={talent.resumeSource}
            photoCount={talent.photos.length}
          />
        </section>
      </div>
    </>
  )
}
