import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { AlertCircle, Check, Lock, LogOut } from "lucide-react"
import { AuthShell } from "@/components/auth/auth-shell"
import { AuthHeading } from "@/components/auth/auth-form"
import { SubscribeButton } from "./subscribe-button"
import { requireTalentRaw, isSubscriptionActive } from "@/lib/auth"
import { createCheckoutSession, getStripe } from "@/lib/stripe"
import type Stripe from "stripe"

export const metadata: Metadata = {
  title: "サブスクリプション | VOZEL",
}

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

  const plan = await getPlanInfo(talent.subscription?.priceId ?? undefined)
  const { error } = await searchParams

  async function handleSubscribe() {
    "use server"
    const t = await requireTalentRaw()
    if (!t.email) return
    const stripeCustomerId = t.subscription?.stripeCustomerId
    const baseUrl = await getBaseUrl()

    let url: string | null = null
    let customerId: string | undefined

    try {
      const result = await createCheckoutSession(t.id, t.email, stripeCustomerId, t.subscription?.priceId, baseUrl)
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
    <AuthShell>
      <AuthHeading
        title="サブスクリプション"
        description="案件情報の閲覧にはサブスクリプションが必要です。"
      />

      <div className="mt-8 rounded-xl border border-neutral-200 p-5">
        {plan ? (
          <>
            <p className="text-sm font-medium text-neutral-600">{plan.name}</p>
            <p className="mt-1 flex items-baseline gap-1">
              <span className="text-3xl font-semibold tracking-tight tabular-nums">
                {formatAmount(plan.amount, plan.currency)}
              </span>
              <span className="text-sm text-neutral-500">/{INTERVAL_LABELS[plan.interval] ?? plan.interval}</span>
            </p>
          </>
        ) : (
          <p className="text-sm text-neutral-500">プランを確認中...</p>
        )}
        <p className="mt-4 flex items-start gap-2 border-t border-neutral-100 pt-4 text-sm text-neutral-700">
          <Check className="mt-0.5 size-4 shrink-0 text-neutral-950" aria-hidden="true" />
          案件閲覧・応募が可能になります
        </p>
      </div>

      {error === "stripe" && (
        <p role="alert" className="mt-6 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>決済の開始に失敗しました。しばらく時間をおいて再度お試しください。</span>
        </p>
      )}

      <form action={handleSubscribe} className="mt-6">
        <SubscribeButton />
      </form>
      <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-neutral-500">
        <Lock className="size-3.5" aria-hidden="true" />
        お支払いは Stripe の決済画面で行います
      </p>

      <div className="mt-8 border-t border-neutral-200 pt-6">
        <a
          href="/auth/logout"
          className="inline-flex items-center gap-1.5 rounded-sm text-sm text-neutral-500 underline-offset-4 transition-colors hover:text-neutral-950 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950"
        >
          <LogOut className="size-4" aria-hidden="true" />
          ログアウト
        </a>
      </div>
    </AuthShell>
  )
}
