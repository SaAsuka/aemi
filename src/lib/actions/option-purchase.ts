"use server"

import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { prisma } from "@/lib/db"
import { requireTalent } from "@/lib/auth"
import { getStripe } from "@/lib/stripe"
import { resolveStorageUrl } from "@/lib/storage-url"

async function getBaseUrl() {
  const headersList = await headers()
  const host = headersList.get("host") || "localhost:3000"
  const protocol = host.includes("localhost") ? "http" : "https"
  return `${protocol}://${host}`
}

export async function getActiveOptionsForTalent(talentId: string) {
  const [options, purchases] = await Promise.all([
    prisma.option.findMany({
      where: { status: "ACTIVE" },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    }),
    prisma.optionPurchase.findMany({
      where: { talentId },
      select: { optionId: true, status: true },
    }),
  ])

  const purchaseMap = new Map(purchases.map((p) => [p.optionId, p.status]))

  return Promise.all(options.map(async (opt) => ({
    ...opt,
    imageUrl: await resolveStorageUrl(opt.imageUrl),
    purchaseStatus: purchaseMap.get(opt.id) ?? null,
  })))
}

export async function createOptionCheckout(optionId: string): Promise<void> {
  const talent = await requireTalent()

  const option = await prisma.option.findUnique({ where: { id: optionId } })
  if (!option || option.status !== "ACTIVE" || !option.stripePriceId) {
    redirect("/mypage/options?error=unavailable")
  }

  const existing = await prisma.optionPurchase.findUnique({
    where: { optionId_talentId: { optionId, talentId: talent.id } },
  })
  if (existing?.status === "PAID") {
    redirect("/mypage/options?error=paid")
  }

  const baseUrl = await getBaseUrl()
  let session
  try {
    const stripe = getStripe()
    session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: talent.email ?? undefined,
      line_items: [{ price: option.stripePriceId, quantity: 1 }],
      success_url: `${baseUrl}/mypage/options?purchased=1`,
      cancel_url: `${baseUrl}/mypage/options/${optionId}`,
      metadata: { optionId, talentId: talent.id },
    })
  } catch (e) {
    console.error("Stripe checkout session作成エラー:", e)
    redirect(`/mypage/options/${optionId}?error=stripe`)
  }

  if (existing) {
    await prisma.optionPurchase.update({
      where: { id: existing.id },
      data: { stripeSessionId: session.id, status: "PENDING" },
    })
  } else {
    await prisma.optionPurchase.create({
      data: {
        optionId,
        talentId: talent.id,
        stripeSessionId: session.id,
        status: "PENDING",
      },
    })
  }

  redirect(session.url!)
}
