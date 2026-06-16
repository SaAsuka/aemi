import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { requireTalentRaw, isSubscriptionActive, getSession } from "@/lib/auth"
import { createCheckoutSession, getStripe } from "@/lib/stripe"
import type Stripe from "stripe"

async function getBaseUrl() {
  const h = await headers()
  const host = h.get("host") || "localhost:3000"
  return host.includes("localhost") ? `http://${host}` : `https://${host}`
}

async function getPlanInfo(priceId: string | undefined) {
  if (!priceId) return null
  try {
    const stripe = getStripe()
    const price = await stripe.prices.retrieve(priceId, { expand: ["product"] })
    const product = price.product as Stripe.Product
    return {
      name: product.name,
      amount: price.unit_amount,
      currency: price.currency,
      interval: price.recurring?.interval ?? "month",
    }
  } catch {
    return null
  }
}

function formatAmount(amount: number | null, currency: string) {
  if (amount === null) return "—"
  return new Intl.NumberFormat("ja-JP", { style: "currency", currency }).format(amount)
}

const INTERVAL_LABELS: Record<string, string> = {
  month: "月",
  year: "年",
  week: "週",
  day: "日",
}

export default async function SubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const talent = await requireTalentRaw()

  if (isSubscriptionActive(talent)) redirect("/jobs")
  if (!talent.email) redirect("/auth/login")

  const session = await getSession()
  const plan = await getPlanInfo(session.stripePriceId)
  const { error } = await searchParams

  async function handleSubscribe() {
    "use server"
    const t = await requireTalentRaw()
    if (!t.email) return
    const stripeCustomerId = t.subscription?.stripeCustomerId
    const s = await getSession()
    const baseUrl = await getBaseUrl()

    let url: string | null = null
    let customerId: string | undefined

    try {
      const result = await createCheckoutSession(t.id, t.email, stripeCustomerId, s.stripePriceId, baseUrl)
      url = result.url
      customerId = result.customerId
    } catch (e) {
      console.error("Stripe checkout session作成エラー:", e)
      redirect("/subscribe?error=stripe")
    }

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
          {plan ? (
            <>
              <p className="text-sm font-medium">{plan.name}</p>
              <p className="text-lg font-bold">
                {formatAmount(plan.amount, plan.currency)}
                <span className="text-sm font-normal text-muted-foreground">/{INTERVAL_LABELS[plan.interval] ?? plan.interval}</span>
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">プランを確認中...</p>
          )}
          <p className="text-sm text-muted-foreground">案件閲覧・応募が可能になります</p>
        </div>
        {error === "stripe" && (
          <p className="text-sm text-red-600">決済の開始に失敗しました。しばらく時間をおいて再度お試しください。</p>
        )}
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
