import type { Metadata } from "next"
import { Suspense } from "react"
import { AuthShell } from "@/components/auth/auth-shell"
import { TalentLoginForm } from "./login-form"

export const metadata: Metadata = {
  title: "ログイン | VOZEL",
}

export default function TalentLoginPage() {
  return (
    <AuthShell>
      <Suspense>
        <TalentLoginForm />
      </Suspense>
    </AuthShell>
  )
}
