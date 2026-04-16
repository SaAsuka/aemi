import "dotenv/config"
import pg from "pg"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../src/generated/prisma/client.js"
import Stripe from "stripe"

const STATUS_MAP: Record<string, "ACTIVE" | "PAST_DUE" | "CANCELED" | "UNPAID"> = {
  active: "ACTIVE",
  past_due: "PAST_DUE",
  canceled: "CANCELED",
  unpaid: "UNPAID",
}

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 2 })
  const adapter = new PrismaPg(pool)
  const prisma = new PrismaClient({ adapter })
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

  const customers: Stripe.Customer[] = []
  for await (const c of stripe.customers.list({ limit: 100, expand: ["data.subscriptions"] })) {
    if (!c.deleted) customers.push(c as Stripe.Customer)
  }
  console.log("Stripe顧客数:", customers.length)

  const talents = await prisma.talent.findMany({
    where: { email: { not: null } },
    select: { id: true, email: true, name: true },
  })
  const emailMap = new Map(talents.filter(t => t.email).map(t => [t.email!.toLowerCase(), t]))
  console.log("タレント数:", talents.length)

  let matched = 0
  for (const customer of customers) {
    const email = customer.email?.toLowerCase()
    if (!email) continue
    const talent = emailMap.get(email)
    if (!talent) continue
    matched++

    const sub = customer.subscriptions?.data?.[0]
    const status = sub ? (STATUS_MAP[sub.status] || "NONE") : "NONE"
    const periodEnd = sub?.items?.data?.[0]?.current_period_end
      ? new Date(sub.items.data[0].current_period_end * 1000)
      : null

    await prisma.talentSubscription.upsert({
      where: { talentId: talent.id },
      create: {
        talentId: talent.id,
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
    console.log(`  ✓ ${talent.name} (${email}) → ${status}${periodEnd ? " 〜" + periodEnd.toISOString().slice(0, 10) : ""}`)
  }

  console.log(`\nマッチ: ${matched}件`)
  await prisma.$disconnect()
  await pool.end()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
