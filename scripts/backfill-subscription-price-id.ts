// 既に契約済み（subscriptionIdがある）だが priceId が空のレコードを、
// Stripe側の実際の契約情報から正確に埋める。
//
// 使い方（本番の環境変数を使って実行する。管理者が実行すること）：
//   npx tsx scripts/backfill-subscription-price-id.ts          … ドライラン（更新せず一覧表示のみ）
//   npx tsx scripts/backfill-subscription-price-id.ts --apply  … 実際に更新する
//
// 必要な環境変数: DATABASE_URL, STRIPE_SECRET_KEY（本番のものを使うこと）

import dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

import Stripe from "stripe"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../src/generated/prisma/client"

const apply = process.argv.includes("--apply")

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { timeout: 30000, maxNetworkRetries: 1 })

async function main() {
  console.log(`接続先DB: ${process.env.DATABASE_URL?.replace(/:[^:@]+@/, ":***@")}`)
  console.log(`モード: ${apply ? "本適用" : "ドライラン（--apply を付けると実際に更新します）"}`)
  console.log("---")

  const targets = await prisma.talentSubscription.findMany({
    where: { subscriptionId: { not: null }, priceId: null },
    select: { id: true, talentId: true, subscriptionId: true },
  })

  console.log(`対象: ${targets.length} 件\n`)

  let updated = 0
  let failed = 0

  for (const t of targets) {
    try {
      const subscription = await stripe.subscriptions.retrieve(t.subscriptionId!, { expand: ["items"] })
      const priceId = subscription.items.data[0]?.price.id

      if (!priceId) {
        console.log(`✗ talentId=${t.talentId} subscriptionId=${t.subscriptionId} → 価格IDが見つかりませんでした`)
        failed++
        continue
      }

      console.log(`${apply ? "✓" : "→"} talentId=${t.talentId} subscriptionId=${t.subscriptionId} → priceId=${priceId}`)

      if (apply) {
        await prisma.talentSubscription.update({
          where: { id: t.id },
          data: { priceId },
        })
      }
      updated++
    } catch (e) {
      console.log(`✗ talentId=${t.talentId} subscriptionId=${t.subscriptionId} → 取得失敗: ${e instanceof Error ? e.message : e}`)
      failed++
    }
  }

  console.log("---")
  console.log(`${apply ? "更新" : "更新対象"}: ${updated} 件 / 失敗: ${failed} 件`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
