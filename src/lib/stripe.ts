import Stripe from "stripe"

let _stripe: Stripe | null = null

export function getStripe() {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      timeout: 30000,
      maxNetworkRetries: 1,
    })
  }
  return _stripe
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

export async function createCheckoutSession(talentId: string, email: string, stripeCustomerId?: string | null) {
  const stripe = getStripe()
  let customerId = stripeCustomerId
  if (!customerId) {
    const customer = await stripe.customers.create({ email, metadata: { talentId } })
    customerId = customer.id
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: 1 }],
    success_url: `${APP_URL}/auth/checkout-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${APP_URL}/subscribe`,
    metadata: { talentId },
  })

  return { url: session.url, customerId }
}

export async function createBillingPortalSession(stripeCustomerId: string) {
  const stripe = getStripe()
  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: `${APP_URL}/jobs`,
  })
  return session.url
}
