import { NextResponse } from "next/server"
import { getStripe } from "@/lib/stripe"
import { requireAdmin } from "@/lib/auth"
import { encryptPriceId } from "@/lib/register-token"
import type Stripe from "stripe"

export async function GET() {
  await requireAdmin()
  const stripe = getStripe()

  const prices = await stripe.prices.list({
    active: true,
    type: "recurring",
    expand: ["data.product"],
    limit: 20,
  })

  const plans = prices.data
    .filter((p) => typeof p.product === "object" && (p.product as Stripe.Product).active)
    .sort((a, b) => (a.unit_amount ?? 0) - (b.unit_amount ?? 0))
    .map((p) => {
      const product = p.product as Stripe.Product
      return {
        token: encryptPriceId(p.id),
        name: product.name,
        description: product.description ?? null,
        amount: p.unit_amount,
        currency: p.currency,
        interval: p.recurring?.interval ?? "month",
      }
    })

  return NextResponse.json(plans)
}
