import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { getStripe } from "@/lib/stripe"

// 一時的な対応用エンドポイント。既に契約済み（subscriptionIdがある）だが
// priceIdが空のレコードを、Stripe側の実際の契約内容から埋める。
// 対応完了後はこのファイルごと削除してよい。
//
// 使い方（管理者としてログインした状態でブラウザから）：
//   /api/admin/backfill-subscription-price-id           … ドライラン（更新しない）
//   /api/admin/backfill-subscription-price-id?apply=true … 実際に更新する
export async function GET(request: NextRequest) {
  await requireAdmin()

  const apply = request.nextUrl.searchParams.get("apply") === "true"
  const stripe = getStripe()

  const targets = await prisma.talentSubscription.findMany({
    where: { subscriptionId: { not: null }, priceId: null },
    select: { id: true, talentId: true, subscriptionId: true },
  })

  const results: Record<string, unknown>[] = []
  let updated = 0
  let failed = 0

  for (const t of targets) {
    try {
      const subscription = await stripe.subscriptions.retrieve(t.subscriptionId!, { expand: ["items"] })
      const priceId = subscription.items.data[0]?.price.id

      if (!priceId) {
        results.push({ talentId: t.talentId, subscriptionId: t.subscriptionId, error: "価格IDが見つかりませんでした" })
        failed++
        continue
      }

      results.push({ talentId: t.talentId, subscriptionId: t.subscriptionId, priceId, applied: apply })

      if (apply) {
        await prisma.talentSubscription.update({
          where: { id: t.id },
          data: { priceId },
        })
      }
      updated++
    } catch (e) {
      results.push({ talentId: t.talentId, subscriptionId: t.subscriptionId, error: e instanceof Error ? e.message : String(e) })
      failed++
    }
  }

  return NextResponse.json({
    mode: apply ? "適用済み" : "ドライラン（?apply=true で実際に更新されます）",
    target_count: targets.length,
    updated,
    failed,
    results,
  })
}
