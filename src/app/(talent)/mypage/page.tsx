import { requireTalent } from "@/lib/auth"
import { getTalentApplications } from "@/lib/actions/talent"
import { TalentNav } from "@/components/talent-nav"
import { TalentApplicationHistory } from "@/components/talent-application-history"
import { Briefcase } from "lucide-react"
import { LineConnectAlert } from "@/components/line-connect-alert"

export default async function MyPage() {
  const talent = await requireTalent()
  const applications = await getTalentApplications(talent.id)

  const displayName = talent.stageName || talent.name

  return (
    <>
      <TalentNav talentName={displayName} />
      <div className="mx-auto max-w-7xl px-4 py-8 space-y-6">
        {!talent.lineUserId && (
          <LineConnectAlert />
        )}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">応募状況</h2>
          </div>
          <TalentApplicationHistory applications={applications} />
        </section>
      </div>
    </>
  )
}
