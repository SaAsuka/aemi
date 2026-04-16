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

export async function syncStripeCustomers(): Promise<{ totalCustomers: number; matched: number; updated: number } | { error: string }> {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return { error: "STRIPE_SECRET_KEY が未設定です" }
    }

    const stripe = getStripe()

    const customers: Stripe.Customer[] = []
    for await (const customer of stripe.customers.list({ limit: 100, expand: ["data.subscriptions"] })) {
      if (!customer.deleted) {
        customers.push(customer as Stripe.Customer)
      }
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

    return { totalCustomers: customers.length, matched, updated }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error("Stripe同期エラー:", msg)
    return { error: msg }
  }
}
