import { requireTalent } from "@/lib/auth"
import { WelcomeTutorial } from "@/components/welcome-tutorial"

export default async function WelcomePage() {
  const talent = await requireTalent()
  const displayName = talent.stageName || talent.name
  const hasLine = !!talent.lineUserId

  return (
    <div className="min-h-dvh flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <WelcomeTutorial talentName={displayName} hasLine={hasLine} />
      </div>
    </div>
  )
}
