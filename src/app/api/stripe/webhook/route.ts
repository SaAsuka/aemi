import { NextRequest, NextResponse } from "next/server"
import { getStripe } from "@/lib/stripe"
import { prisma } from "@/lib/db"
import type Stripe from "stripe"

function getPeriodEnd(subscription: Stripe.Subscription): Date | null {
  const item = subscription.items?.data?.[0]
  if (item?.current_period_end) {
    return new Date(item.current_period_end * 1000)
  }
  return null
}

export async function POST(request: NextRequest) {
  const stripe = getStripe()
  const body = await request.text()
  const signature = request.headers.get("stripe-signature")!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: "Webhook signature verification failed" }, { status: 400 })
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session
      const talentId = session.metadata?.talentId
      if (talentId && session.subscription) {
        const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription.id
        const subscription = await stripe.subscriptions.retrieve(subscriptionId, { expand: ["items"] })
        const periodEnd = getPeriodEnd(subscription)
        await prisma.talentSubscription.upsert({
          where: { talentId },
          create: {
            talentId,
            stripeCustomerId: typeof session.customer === "string" ? session.customer : session.customer?.id,
            subscriptionId,
            status: "ACTIVE",
            ...(periodEnd && { currentPeriodEnd: periodEnd }),
          },
          update: {
            stripeCustomerId: typeof session.customer === "string" ? session.customer : session.customer?.id,
            subscriptionId,
            status: "ACTIVE",
            ...(periodEnd && { currentPeriodEnd: periodEnd }),
          },
        })
      }
      break
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription
      const subscriptionId = subscription.id
      const sub = await prisma.talentSubscription.findUnique({ where: { subscriptionId } })
      if (sub) {
        const statusMap: Record<string, "ACTIVE" | "PAST_DUE" | "CANCELED" | "UNPAID"> = {
          active: "ACTIVE",
          past_due: "PAST_DUE",
          canceled: "CANCELED",
          unpaid: "UNPAID",
        }
        const periodEnd = getPeriodEnd(subscription)
        await prisma.talentSubscription.update({
          where: { id: sub.id },
          data: {
            status: statusMap[subscription.status] || "NONE",
            ...(periodEnd && { currentPeriodEnd: periodEnd }),
          },
        })
      }
      break
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription
      const sub = await prisma.talentSubscription.findUnique({ where: { subscriptionId: subscription.id } })
      if (sub) {
        await prisma.talentSubscription.update({
          where: { id: sub.id },
          data: { status: "CANCELED" },
        })
      }
      break
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice
      const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id
      if (customerId) {
        const sub = await prisma.talentSubscription.findUnique({ where: { stripeCustomerId: customerId } })
        if (sub) {
          await prisma.talentSubscription.update({
            where: { id: sub.id },
            data: { status: "PAST_DUE" },
          })
        }
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}
