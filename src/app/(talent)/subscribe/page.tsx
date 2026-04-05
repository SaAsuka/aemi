import { redirect } from "next/navigation"
import { requireTalent, isSubscriptionActive } from "@/lib/auth"
import { createCheckoutSession } from "@/lib/stripe"

export default async function SubscribePage() {
  const talent = await requireTalent()

  if (isSubscriptionActive(talent)) redirect("/jobs")
  if (!talent.email) redirect("/auth/login")

  async function handleSubscribe() {
    "use server"
    const t = await requireTalent()
    if (!t.email) return
    const stripeCustomerId = t.subscription?.stripeCustomerId
    const { url, customerId } = await createCheckoutSession(t.id, t.email, stripeCustomerId)
    if (customerId && !stripeCustomerId) {
      const { prisma } = await import("@/lib/db")
      await prisma.talentSubscription.upsert({
        where: { talentId: t.id },
        create: { talentId: t.id, stripeCustomerId: customerId },
        update: { stripeCustomerId: customerId },
      })
    }
    if (url) redirect(url)
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm space-y-6 p-6 text-center">
        <h1 className="text-2xl font-bold">VOZEL</h1>
        <p className="text-muted-foreground text-sm">
          案件情報の閲覧にはサブスクリプションが必要です。
        </p>
        <div className="rounded-lg border p-4 space-y-2">
          <p className="text-lg font-bold">&yen;4,000<span className="text-sm font-normal text-muted-foreground">/月</span></p>
          <p className="text-sm text-muted-foreground">案件閲覧・応募が可能になります</p>
        </div>
        <form action={handleSubscribe}>
          <button
            type="submit"
            className="w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
          >
            サブスクリプションを開始
          </button>
        </form>
        <a href="/auth/logout" className="text-sm text-muted-foreground hover:underline block">
          ログアウト
        </a>
      </div>
    </div>
  )
}
