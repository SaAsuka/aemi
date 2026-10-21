import type { Metadata } from "next"
import { Suspense } from "react"
import { AuthShell } from "@/components/auth/auth-shell"
import { ResetPasswordForm } from "./reset-password-form"

export const metadata: Metadata = {
  title: "パスワード設定 | VOZEL",
}

export default function ResetPasswordPage() {
  return (
    <AuthShell>
      <Suspense>
        <ResetPasswordForm />
      </Suspense>
    </AuthShell>
  )
}
