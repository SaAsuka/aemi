import type { Metadata } from "next"
import { Suspense } from "react"
import { AuthShell } from "@/components/auth/auth-shell"
import { VerifyContent, VerifyingView } from "./verify-content"

export const metadata: Metadata = {
  title: "メール確認 | VOZEL",
}

export default function VerifyPage() {
  return (
    <AuthShell>
      <Suspense fallback={<VerifyingView />}>
        <VerifyContent />
      </Suspense>
    </AuthShell>
  )
}
