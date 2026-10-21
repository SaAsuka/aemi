import { requireTalent } from "@/lib/auth"
import { getTalentApplications, getTalentForProfile } from "@/lib/actions/talent"
import { calcProfileCompleteness } from "@/lib/utils/profile-completeness"
import { TalentNav } from "@/components/talent-nav"
import { TalentApplicationHistory } from "@/components/talent-application-history"
import { ProfileCompleteness } from "@/components/profile-completeness"
import type { Metadata } from "next"
import { LineConnectAlert } from "@/components/line-connect-alert"

export const metadata: Metadata = {
  title: "マイページ | VOZEL",
}

export default async function MyPage() {
  const talent = await requireTalent()
  const [applications, profile] = await Promise.all([
    getTalentApplications(talent.id),
    getTalentForProfile(talent.id),
  ])

  const displayName = talent.stageName || talent.name
  const completeness = profile ? calcProfileCompleteness(profile) : null

  return (
    <div className="min-h-[100dvh] bg-white">
      <TalentNav talentName={displayName} />
      <main className="mx-auto max-w-3xl px-4 pb-[calc(3rem+env(safe-area-inset-bottom))] pt-8 text-neutral-950 sm:pt-10">
        <h1 className="text-2xl font-semibold tracking-tight">マイページ</h1>

        {(!talent.lineUserId || (completeness && completeness.percentage < 100)) && (
          <div className="mt-6 space-y-4">
            {!talent.lineUserId && (
              <LineConnectAlert />
            )}

            {completeness && completeness.percentage < 100 && (
              <ProfileCompleteness
                percentage={completeness.percentage}
                incomplete={completeness.incomplete}
              />
            )}
          </div>
        )}

        <section className="mt-10" aria-labelledby="applications-heading">
          <h2 id="applications-heading" className="text-lg font-semibold">応募状況</h2>
          <div className="mt-4">
            <TalentApplicationHistory applications={applications} />
          </div>
        </section>
      </main>
    </div>
  )
}
