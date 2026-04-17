"use server"

import { revalidatePath, updateTag } from "next/cache"
import { prisma } from "@/lib/db"
import type { SubscriptionStatus } from "@/generated/prisma/client"

const STATUS_MAP: Record<string, SubscriptionStatus> = {
  active: "ACTIVE",
  past_due: "PAST_DUE",
  canceled: "CANCELED",
  unpaid: "UNPAID",
}

type SyncResult = {
  step1?: string
  step2?: string
  step3?: string
  error?: string
  totalCustomers?: number
  matched?: number
  updated?: number
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

export async function syncStripeCustomers(): Promise<SyncResult> {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    return { error: "STRIPE_SECRET_KEY が未設定", step1: "FAIL" }
  }
  const step1 = `OK (${key.slice(0, 10)}...)`

  try {
    await stripeFetch("/balance", key)
  } catch (e) {
    return { step1, step2: `FAIL: ${e instanceof Error ? e.message : String(e)}`, error: "Step2で失敗" }
  }
  const step2 = "OK"

  try {
    const subs: Array<{ id: string; status: string; customer: string; current_period_end: number }> = []
    let startingAfter = ""
    let hasMore = true
    while (hasMore) {
      const params = new URLSearchParams({ limit: "100", status: "all" })
      if (startingAfter) params.set("starting_after", startingAfter)
      const data = await stripeFetch(`/subscriptions?${params}`, key)
      for (const s of data.data) {
        subs.push({
          id: s.id,
          status: s.status,
          customer: typeof s.customer === "string" ? s.customer : s.customer.id,
          current_period_end: s.current_period_end,
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
        create: {
          talentId,
          stripeCustomerId: sub.customer,
          subscriptionId: sub.id,
          status,
          currentPeriodEnd: periodEnd,
        },
        update: {
          stripeCustomerId: sub.customer,
          subscriptionId: sub.id,
          status,
          currentPeriodEnd: periodEnd,
        },
      })
      updated++
    }

    revalidatePath("/admin/talents")
    updateTag("talents")

    return {
      step1,
      step2,
      step3: "OK",
      totalCustomers: customerIds.length,
      matched,
      updated,
    }
  } catch (e) {
    return { step1, step2, step3: `FAIL: ${e instanceof Error ? e.message : String(e)}`, error: "Step3で失敗" }
  }
}
