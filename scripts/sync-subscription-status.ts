// 指定したタレントについて、Stripe側の実際の契約状況をDBに同期する。
// 「Stripeでは決済済みなのに、DB上は未決済のまま」というズレを直す一時スクリプト。
//
// 使い方（本番の環境変数で実行）：
//   npx tsx scripts/sync-subscription-status.ts <talentId> [<talentId2> ...]

import dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

import Stripe from "stripe"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../src/generated/prisma/client"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { timeout: 30000, maxNetworkRetries: 1 })

const statusMap: Record<string, "ACTIVE" | "PAST_DUE" | "CANCELED" | "UNPAID"> = {
  active: "ACTIVE",
  past_due: "PAST_DUE",
  canceled: "CANCELED",
  unpaid: "UNPAID",
}

function getPeriodEnd(subscription: Stripe.Subscription): Date | null {
  const item = subscription.items?.data?.[0]
  if (item?.current_period_end) return new Date(item.current_period_end * 1000)
  return null
}

async function main() {
  const talentIds = process.argv.slice(2)
  if (talentIds.length === 0) {
    console.error("使い方: npx tsx scripts/sync-subscription-status.ts <talentId> [<talentId2> ...]")
    process.exit(1)
  }

  console.log(`接続先DB: ${process.env.DATABASE_URL?.replace(/:[^:@]+@/, ":***@")}`)
  console.log("---")

  for (const talentId of talentIds) {
    const sub = await prisma.talentSubscription.findUnique({ where: { talentId } })
    if (!sub) {
      console.log(`✗ talentId=${talentId} → talent_subscriptions にレコードがありません`)
      continue
    }

    if (!sub.stripeCustomerId) {
      console.log(`✗ talentId=${talentId} → stripeCustomerId が無く、Stripe上の顧客を特定できません`)
      continue
    }

    // 顧客に紐づくアクティブな契約を取得（複数ある場合は最新のものを使う）
    const subscriptions = await stripe.subscriptions.list({
      customer: sub.stripeCustomerId,
      limit: 1,
      expand: ["data.items"],
    })
    const subscription = subscriptions.data[0]

    if (!subscription) {
      console.log(`✗ talentId=${talentId} customer=${sub.stripeCustomerId} → Stripe側に契約が見つかりません`)
      continue
    }

    const priceId = subscription.items.data[0]?.price.id
    const periodEnd = getPeriodEnd(subscription)
    const status = statusMap[subscription.status] ?? "NONE"

    await prisma.talentSubscription.update({
      where: { talentId },
      data: {
        subscriptionId: subscription.id,
        status,
        ...(priceId && { priceId }),
        ...(periodEnd && { currentPeriodEnd: periodEnd }),
      },
    })

    console.log(`✓ talentId=${talentId} → status=${status} subscriptionId=${subscription.id} priceId=${priceId}`)
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
