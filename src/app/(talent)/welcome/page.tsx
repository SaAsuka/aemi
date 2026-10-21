import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { requireTalent, isSubscriptionActive } from "@/lib/auth"
import { AuthShell } from "@/components/auth/auth-shell"
import { WelcomeTutorial } from "@/components/welcome-tutorial"

export const metadata: Metadata = {
  title: "ようこそ | VOZEL",
}

export default async function WelcomePage() {
  const talent = await requireTalent()
  if (!isSubscriptionActive(talent)) redirect("/subscribe")
  const displayName = talent.stageName || talent.name
  const hasLine = !!talent.lineUserId

  return (
    <AuthShell>
      <WelcomeTutorial talentName={displayName} hasLine={hasLine} />
    </AuthShell>
  )
}
