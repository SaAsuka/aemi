import type { Metadata } from "next"
import { Check, Loader2 } from "lucide-react"
import { AuthShell } from "@/components/auth/auth-shell"
import { AuthHeading } from "@/components/auth/auth-form"
import { RedirectToWelcome } from "./redirect-to-welcome"

export const metadata: Metadata = {
  title: "登録完了 | VOZEL",
}

export default function CheckoutSuccessPage() {
  return (
    <AuthShell>
      <RedirectToWelcome />
      <div className="flex size-12 items-center justify-center rounded-full bg-neutral-950">
        <Check className="size-6 text-white" aria-hidden="true" />
      </div>
      <AuthHeading
        title="登録完了"
        description="サブスクリプションの登録が完了しました。"
        className="mt-6"
      />
      <p role="status" className="mt-8 flex items-center gap-2 text-sm text-neutral-500">
        <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
        使い方のご案内に移動します…
      </p>
    </AuthShell>
  )
}
