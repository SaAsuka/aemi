import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { getStripe } from "@/lib/stripe"
import type Stripe from "stripe"

// 一時的な対応用エンドポイント。「Stripeでは決済済みなのにDB上は未決済のまま」という
// ズレを、指定したタレントについてStripe側の実際の契約状況から直す。
// 対応完了後はこのファイルごと削除してよい。
//
// 使い方（管理者としてログインした状態でブラウザから）：
//   /api/admin/sync-subscription-status?talentId=xxx&talentId=yyy            … ドライラン
//   /api/admin/sync-subscription-status?talentId=xxx&talentId=yyy&apply=true … 実際に更新
const STATUS_MAP: Record<string, "ACTIVE" | "PAST_DUE" | "CANCELED" | "UNPAID"> = {
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

export async function GET(request: NextRequest) {
  await requireAdmin()

  const talentIds = request.nextUrl.searchParams.getAll("talentId")
  if (talentIds.length === 0) {
    return NextResponse.json({ error: "talentId を1つ以上クエリパラメータで指定してください" }, { status: 400 })
  }
  const apply = request.nextUrl.searchParams.get("apply") === "true"

  const stripe = getStripe()
  const results: Record<string, unknown>[] = []

  for (const talentId of talentIds) {
    const sub = await prisma.talentSubscription.findUnique({ where: { talentId } })
    if (!sub) {
      results.push({ talentId, error: "talent_subscriptions にレコードがありません" })
      continue
    }
    if (!sub.stripeCustomerId) {
      results.push({ talentId, error: "stripeCustomerId が無く、Stripe上の顧客を特定できません" })
      continue
    }

    try {
      const subscriptions = await stripe.subscriptions.list({
        customer: sub.stripeCustomerId,
        limit: 1,
        expand: ["data.items"],
      })
      const subscription = subscriptions.data[0]

      if (!subscription) {
        results.push({ talentId, stripeCustomerId: sub.stripeCustomerId, error: "Stripe側に契約が見つかりません" })
        continue
      }

      const priceId = subscription.items.data[0]?.price.id
      const periodEnd = getPeriodEnd(subscription)
      const status = STATUS_MAP[subscription.status] ?? "NONE"

      if (apply) {
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

      results.push({ talentId, status, subscriptionId: subscription.id, priceId, applied: apply })
    } catch (e) {
      results.push({ talentId, error: e instanceof Error ? e.message : String(e) })
    }
  }

  return NextResponse.json({ results })
}
