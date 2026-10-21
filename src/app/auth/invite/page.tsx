import type { Metadata } from "next"
import { Suspense } from "react"
import { AuthShell } from "@/components/auth/auth-shell"
import { InviteContent, RegisteringView } from "./invite-content"

export const metadata: Metadata = {
  title: "ご招待 | VOZEL",
}

export default function InvitePage() {
  return (
    <AuthShell>
      <Suspense fallback={<RegisteringView />}>
        <InviteContent />
      </Suspense>
    </AuthShell>
  )
}
