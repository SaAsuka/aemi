"use server"

import { revalidatePath, updateTag } from "next/cache"
import { prisma } from "@/lib/db"
import { getStripe } from "@/lib/stripe"
import type Stripe from "stripe"
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

export async function syncStripeCustomers(): Promise<SyncResult> {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    return { error: "STRIPE_SECRET_KEY が未設定", step1: "FAIL" }
  }
  const keyPrefix = key.slice(0, 10) + "..."
  const step1 = `OK (${keyPrefix})`

  let stripe: Stripe
  try {
    stripe = getStripe()
  } catch (e) {
    return { step1, step2: `FAIL: Stripe初期化エラー - ${e instanceof Error ? e.message : String(e)}`, error: "Step2で失敗" }
  }

  let step2 = ""
  try {
    const res = await fetch("https://api.stripe.com/v1/balance", {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(10000),
    })
    const status = res.status
    const body = await res.text()
    if (status === 200) {
      step2 = `OK (fetch balance: ${status})`
    } else {
      return { step1, step2: `FAIL(fetch ${status}): ${body.slice(0, 200)}`, error: "Step2で失敗" }
    }
  } catch (e) {
    const msg = e instanceof Error ? `${e.name}: ${e.message}` : String(e)
    return { step1, step2: `FAIL(fetch): ${msg}`, error: "Step2で失敗" }
  }

  try {
    const customers: Stripe.Customer[] = []
    let hasMore = true
    let startingAfter: string | undefined
    while (hasMore) {
      const params: Stripe.CustomerListParams = { limit: 100, expand: ["data.subscriptions"] }
      if (startingAfter) params.starting_after = startingAfter
      const list = await stripe.customers.list(params)
      for (const c of list.data) {
        if (!c.deleted) customers.push(c as Stripe.Customer)
      }
      hasMore = list.has_more
      if (list.data.length > 0) startingAfter = list.data[list.data.length - 1].id
    }

    const talents = await prisma.talent.findMany({
      where: { email: { not: null } },
      select: { id: true, email: true },
    })
    const emailToTalent = new Map(
      talents.filter((t) => t.email).map((t) => [t.email!.toLowerCase(), t.id])
    )

    let matched = 0
    let updated = 0

    for (const customer of customers) {
      const email = customer.email?.toLowerCase()
      if (!email) continue

      const talentId = emailToTalent.get(email)
      if (!talentId) continue

      matched++

      const sub = customer.subscriptions?.data?.[0]
      const status: SubscriptionStatus = sub ? (STATUS_MAP[sub.status] ?? "NONE") : "NONE"
      const periodEnd = sub?.items?.data?.[0]?.current_period_end
        ? new Date(sub.items.data[0].current_period_end * 1000)
        : null

      await prisma.talentSubscription.upsert({
        where: { talentId },
        create: {
          talentId,
          stripeCustomerId: customer.id,
          subscriptionId: sub?.id ?? null,
          status,
          currentPeriodEnd: periodEnd,
        },
        update: {
          stripeCustomerId: customer.id,
          subscriptionId: sub?.id ?? null,
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
      totalCustomers: customers.length,
      matched,
      updated,
    }
  } catch (e) {
    return { step1, step2, step3: `FAIL: ${e instanceof Error ? e.message : String(e)}`, error: "Step3で失敗" }
  }
}
