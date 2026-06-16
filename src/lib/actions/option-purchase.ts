"use server"

import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { requireTalent } from "@/lib/auth"
import { getStripe } from "@/lib/stripe"

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

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

  return options.map((opt) => ({
    ...opt,
    purchaseStatus: purchaseMap.get(opt.id) ?? null,
  }))
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

  const stripe = getStripe()
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{ price: option.stripePriceId, quantity: 1 }],
    success_url: `${APP_URL}/mypage/options?purchased=1`,
    cancel_url: `${APP_URL}/mypage/options`,
    metadata: { optionId, talentId: talent.id },
  })

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
