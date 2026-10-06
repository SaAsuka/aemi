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
//   /api/admin/sync-subscription-status?talentId=xxx&talentId=yyy            … 指定した人だけドライラン
//   /api/admin/sync-subscription-status?talentId=xxx&talentId=yyy&apply=true … 指定した人だけ実際に更新
//   /api/admin/sync-subscription-status?all=true                            … Stripe顧客IDを持つ全員をドライラン
//   /api/admin/sync-subscription-status?all=true&apply=true                 … 全員に実際に更新
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
  const all = request.nextUrl.searchParams.get("all") === "true"
  if (talentIds.length === 0 && !all) {
    return NextResponse.json({ error: "talentId を1つ以上指定するか、all=true を付けてください" }, { status: 400 })
  }
  const apply = request.nextUrl.searchParams.get("apply") === "true"

  const stripe = getStripe()
  const results: Record<string, unknown>[] = []

  type Target = { talentId: string; stripeCustomerId: string | null; status: string }
  const targets: Target[] = all
    ? await prisma.talentSubscription.findMany({
        where: { stripeCustomerId: { not: null } },
        select: { talentId: true, stripeCustomerId: true, status: true },
      })
    : (
        await Promise.all(
          talentIds.map((talentId) =>
            prisma.talentSubscription.findUnique({
              where: { talentId },
              select: { talentId: true, stripeCustomerId: true, status: true },
            }),
          ),
        )
      ).map((sub, i) => sub ?? { talentId: talentIds[i], stripeCustomerId: null, status: "__NOT_FOUND__" })

  for (const target of targets) {
    const { talentId } = target
    if (target.status === "__NOT_FOUND__") {
      results.push({ talentId, error: "talent_subscriptions にレコードがありません" })
      continue
    }
    if (!target.stripeCustomerId) {
      results.push({ talentId, error: "stripeCustomerId が無く、Stripe上の顧客を特定できません" })
      continue
    }

    try {
      // limit:1だと「作成日が一番新しい契約」を拾ってしまい、二重決済で後から
      // 解約した方を拾って上書きする事故が起きたため、有効な契約を優先して探す
      const subscriptions = await stripe.subscriptions.list({
        customer: target.stripeCustomerId,
        limit: 10,
        expand: ["data.items"],
      })
      const subscription =
        subscriptions.data.find((s) => s.status === "active" || s.status === "trialing") ??
        subscriptions.data[0]

      if (!subscription) {
        results.push({ talentId, stripeCustomerId: target.stripeCustomerId, error: "Stripe側に契約が見つかりません" })
        continue
      }

      const priceId = subscription.items.data[0]?.price.id
      const periodEnd = getPeriodEnd(subscription)
      const status = STATUS_MAP[subscription.status] ?? "NONE"
      const changed = status !== target.status

      if (apply && changed) {
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

      results.push({
        talentId,
        dbStatusBefore: target.status,
        stripeStatus: status,
        changed,
        subscriptionId: subscription.id,
        priceId,
        subscriptionCreatedAt: new Date(subscription.created * 1000).toISOString(),
        applied: apply && changed,
      })
    } catch (e) {
      results.push({ talentId, error: e instanceof Error ? e.message : String(e) })
    }
  }

  return NextResponse.json({
    checked: results.length,
    changed: results.filter((r) => r.changed === true).length,
    results,
  })
}
