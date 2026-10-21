import type { Metadata } from "next"
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
import { AlertTriangle } from "lucide-react"
import { BTN_SECONDARY, FIELD } from "@/components/talent/styles"
import { LineConnectSection } from "@/components/line-connect-section"

export const metadata: Metadata = {
  title: "設定 | VOZEL",
}

// 写真・作品・コンポジの部品（管理画面と共通）に渡すボタンの見た目
const INNER_BUTTON = `${BTN_SECONDARY} h-10 px-3 text-sm`

// 設定の区切り（枠付きのカード）
function Section({ id, title, description, children }: { id: string; title: string; description?: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="rounded-xl border border-neutral-200 p-5 sm:p-6">
      <h2 id={id} className="text-base font-semibold text-neutral-950">{title}</h2>
      {description && <p className="mt-1 text-sm text-neutral-500">{description}</p>}
      <div className="mt-5">{children}</div>
    </section>
  )
}

export default async function SettingsPage() {
  const session = await requireTalentRaw()
  if (session.nameKana === "未設定") redirect("/setup")
  const talent = await getTalentForSettings(session.id)
  if (!talent) redirect("/auth/login")

  const displayName = talent.stageName || session.name

  return (
    <div className="min-h-[100dvh] bg-white">
      <TalentNav talentName={displayName} />
      <main className="mx-auto max-w-3xl space-y-5 px-4 pb-[calc(3rem+env(safe-area-inset-bottom))] pt-8 text-neutral-950 sm:pt-10">
        <h1 className="text-2xl font-semibold tracking-tight">設定</h1>

        {session.mustChangePassword && (
          <div role="alert" className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-700" aria-hidden="true" />
            <p className="text-sm text-amber-900">
              初期パスワードが設定されています。セキュリティのため、パスワードを変更してください。
            </p>
          </div>
        )}

        <Section id="settings-profile" title="プロフィール編集">
          <TalentForm talent={talent} mode="talent" customAction={updateMyProfile} />
        </Section>

        <Section id="settings-password" title="パスワード変更">
          <ChangePasswordForm mustChangePassword={session.mustChangePassword} hasPassword={!!talent.passwordHash} />
        </Section>

        <Section id="settings-line" title="LINE通知">
          <LineConnectSection connected={!!talent.lineUserId} notifyEnabled={talent.lineNotifyEnabled} />
        </Section>

        <Section id="settings-photos" title="宣材写真" description="ドラッグで並べ替えできます。並び順はコンポジにそのまま使われます。">
          <TalentPhotos talentId={talent.id} photos={talent.photos} buttonClassName={INNER_BUTTON} tileClassName="border-neutral-200" />
        </Section>

        <Section id="settings-works" title="過去作品" description="作品名などを入力してから「追加」で写真を選びます。">
          <TalentWorks
            talentId={talent.id}
            works={talent.works}
            buttonClassName={INNER_BUTTON}
            inputClassName={FIELD}
            itemClassName="border-neutral-200"
          />
        </Section>

        <Section id="settings-composite" title="コンポジPDF">
          <CompositePdfButton
            talentId={talent.id}
            resumeUrl={talent.resume}
            resumeSource={talent.resumeSource}
            photoCount={talent.photos.length}
            buttonClassName={INNER_BUTTON}
          />
        </Section>
      </main>
    </div>
  )
}
