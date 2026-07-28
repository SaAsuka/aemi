"use server"

import { revalidatePath, updateTag } from "next/cache"
import { prisma } from "@/lib/db"
import { getStripe } from "@/lib/stripe"
import { getSession } from "@/lib/auth"
import type { SubscriptionStatus } from "@/generated/prisma/client"

const STATUS_MAP: Record<string, SubscriptionStatus> = {
  active: "ACTIVE",
  past_due: "PAST_DUE",
  canceled: "CANCELED",
  unpaid: "UNPAID",
}

async function stripeFetch(path: string, key: string) {
  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    headers: { Authorization: `Bearer ${key}` },
    signal: AbortSignal.timeout(15000),
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Stripe API ${res.status}: ${body.slice(0, 200)}`)
  }
  return res.json()
}

export async function syncStripeCustomers(): Promise<{ totalCustomers: number; matched: number; updated: number } | { error: string }> {
  try {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) return { error: "STRIPE_SECRET_KEY が未設定" }

    const subs: Array<{ id: string; status: string; customer: string; current_period_end: number }> = []
    let startingAfter = ""
    let hasMore = true
    while (hasMore) {
      const params = new URLSearchParams({ limit: "100", status: "all", "expand[]": "data.items" })
      if (startingAfter) params.set("starting_after", startingAfter)
      const data = await stripeFetch(`/subscriptions?${params}`, key)
      for (const s of data.data) {
        const periodEnd = s.items?.data?.[0]?.current_period_end ?? s.current_period_end ?? 0
        subs.push({
          id: s.id,
          status: s.status,
          customer: typeof s.customer === "string" ? s.customer : s.customer.id,
          current_period_end: periodEnd,
        })
      }
      hasMore = data.has_more
      if (data.data.length > 0) startingAfter = data.data[data.data.length - 1].id
    }

    const customerIds = [...new Set(subs.map(s => s.customer))]
    const customerEmailMap = new Map<string, string>()
    for (const cid of customerIds) {
      const c = await stripeFetch(`/customers/${cid}`, key)
      if (c.email) customerEmailMap.set(cid, c.email.toLowerCase())
    }

    const talents = await prisma.talent.findMany({
      where: { email: { not: null } },
      select: { id: true, email: true },
    })
    const emailToTalent = new Map(
      talents.filter(t => t.email).map(t => [t.email!.toLowerCase(), t.id])
    )

    let matched = 0
    let updated = 0

    for (const sub of subs) {
      const email = customerEmailMap.get(sub.customer)
      if (!email) continue
      const talentId = emailToTalent.get(email)
      if (!talentId) continue

      matched++
      const status: SubscriptionStatus = STATUS_MAP[sub.status] ?? "NONE"
      const periodEnd = sub.current_period_end ? new Date(sub.current_period_end * 1000) : null

      await prisma.talentSubscription.upsert({
        where: { talentId },
        create: { talentId, stripeCustomerId: sub.customer, subscriptionId: sub.id, status, currentPeriodEnd: periodEnd },
        update: { stripeCustomerId: sub.customer, subscriptionId: sub.id, status, currentPeriodEnd: periodEnd },
      })
      updated++
    }

    revalidatePath("/admin/talents")
    updateTag("talents")

    return { totalCustomers: customerIds.length, matched, updated }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error("Stripe同期エラー:", msg)
    return { error: msg }
  }
}

export async function cancelSubscriptionAtPeriodEnd(talentId: string): Promise<{ ok: true } | { error: string }> {
  const session = await getSession()
  if (session.role !== "admin") return { error: "権限がありません" }

  try {
    const sub = await prisma.talentSubscription.findUnique({ where: { talentId } })
    if (!sub?.subscriptionId) return { error: "サブスクリプション情報が見つかりません" }
    if (sub.status !== "ACTIVE") return { error: "アクティブなサブスクリプションがありません" }

    const stripe = getStripe()
    await stripe.subscriptions.update(sub.subscriptionId, { cancel_at_period_end: true })

    revalidatePath(`/admin/talents/${talentId}`)
    updateTag("talents")

    return { ok: true }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error("解約処理エラー:", msg)
    return { error: msg }
  }
}
