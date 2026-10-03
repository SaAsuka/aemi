// 指定したタレントについて、Stripe側の実際の契約状況をDBに同期する。
// 「Stripeでは決済済みなのに、DB上は未決済のまま」というズレを直す一時スクリプト。
//
// 使い方（本番の環境変数で実行）：
//   npx tsx scripts/sync-subscription-status.ts <talentId> [<talentId2> ...]
//   npx tsx scripts/sync-subscription-status.ts --all   … Stripe顧客IDを持つ全員をチェック

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
  const args = process.argv.slice(2)
  const all = args.includes("--all")
  const talentIds = args.filter((a) => a !== "--all")

  if (talentIds.length === 0 && !all) {
    console.error("使い方: npx tsx scripts/sync-subscription-status.ts <talentId> [<talentId2> ...]")
    console.error("     または: npx tsx scripts/sync-subscription-status.ts --all")
    process.exit(1)
  }

  console.log(`接続先DB: ${process.env.DATABASE_URL?.replace(/:[^:@]+@/, ":***@")}`)
  console.log("---")

  type Target = { talentId: string; stripeCustomerId: string | null; status: string } | null

  const targets: { talentId: string; sub: Target }[] = all
    ? (await prisma.talentSubscription.findMany({ where: { stripeCustomerId: { not: null } } }))
        .map((sub) => ({ talentId: sub.talentId, sub }))
    : await Promise.all(
        talentIds.map(async (talentId) => ({
          talentId,
          sub: await prisma.talentSubscription.findUnique({ where: { talentId } }),
        })),
      )

  for (const { talentId, sub } of targets) {
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
    const changed = status !== sub.status

    if (changed) {
      await prisma.talentSubscription.update({
        where: { talentId },
        data: {
          subscriptionId: subscription.id,
          status,
          ...(priceId && { priceId }),
          ...(periodEnd && { currentPeriodEnd: periodEnd }),
        },
      })
    }

    const createdAt = new Date(subscription.created * 1000).toISOString()
    console.log(`${changed ? "✓" : "-"} talentId=${talentId} → DB:${sub.status} → Stripe:${status}${changed ? "（更新）" : "（一致・変更なし）"} 契約開始:${createdAt}`)
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
