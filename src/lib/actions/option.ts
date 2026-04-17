"use server"

import { revalidatePath, updateTag } from "next/cache"
import { prisma } from "@/lib/db"
import { getStripe } from "@/lib/stripe"
import { optionSchema } from "@/lib/validations/option"
import { normalizeDeadline } from "@/lib/utils/date"

function buildOptionWhere(search?: string, status?: string) {
  const where: Record<string, unknown> = {}
  if (search) where.name = { contains: search, mode: "insensitive" }
  if (status && status !== "ALL") where.status = status
  return where
}

export async function getOptionCount(search?: string, status?: string) {
  return prisma.option.count({ where: buildOptionWhere(search, status) })
}

export async function getOptions(search?: string, status?: string, page?: number) {
  const where = buildOptionWhere(search, status)
  const pageSize = 50
  const currentPage = page ?? 1

  return prisma.option.findMany({
    where,
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    skip: (currentPage - 1) * pageSize,
    take: pageSize,
    include: {
      _count: { select: { purchases: true } },
    },
  })
}

export async function getOption(id: string) {
  return prisma.option.findUnique({
    where: { id },
    include: {
      purchases: {
        include: {
          talent: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  })
}

async function ensureStripeProduct(optionId: string, name: string, description: string | null, price: number) {
  const stripe = getStripe()
  const product = await stripe.products.create({
    name,
    description: description || undefined,
    metadata: { optionId },
  })
  const stripePrice = await stripe.prices.create({
    product: product.id,
    unit_amount: price,
    currency: "jpy",
  })
  return { stripeProductId: product.id, stripePriceId: stripePrice.id }
}

async function updateStripePrice(existingProductId: string, existingPriceId: string, newAmount: number) {
  const stripe = getStripe()
  await stripe.prices.update(existingPriceId, { active: false })
  const newPrice = await stripe.prices.create({
    product: existingProductId,
    unit_amount: newAmount,
    currency: "jpy",
  })
  return newPrice.id
}

export async function createOption(formData: FormData) {
  const raw = Object.fromEntries(formData)
  const parsed = optionSchema.safeParse(raw)

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const data = parsed.data
  let stripeData: { stripeProductId: string; stripePriceId: string } | null = null

  if (data.status === "ACTIVE") {
    try {
      stripeData = await ensureStripeProduct("pending", data.name, data.description || null, data.price)
    } catch (e) {
      console.error("Stripe商品作成エラー:", e)
      return { error: { status: ["Stripe商品の作成に失敗しました"] } }
    }
  }

  const option = await prisma.option.create({
    data: {
      name: data.name,
      description: data.description || null,
      category: data.category,
      price: data.price,
      imageUrl: data.imageUrl || null,
      deadline: data.deadline ? normalizeDeadline(data.deadline) : null,
      sortOrder: typeof data.sortOrder === "number" ? data.sortOrder : 0,
      status: data.status,
      ...(stripeData && {
        stripeProductId: stripeData.stripeProductId,
        stripePriceId: stripeData.stripePriceId,
      }),
    },
  })

  if (stripeData) {
    const stripe = getStripe()
    await stripe.products.update(stripeData.stripeProductId, {
      metadata: { optionId: option.id },
    })
  }

  revalidatePath("/admin/options")
  updateTag("options")
  return { success: true }
}

export async function updateOption(id: string, formData: FormData) {
  const raw = Object.fromEntries(formData)
  const parsed = optionSchema.safeParse(raw)

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const data = parsed.data
  const existing = await prisma.option.findUnique({ where: { id } })
  if (!existing) return { error: { name: ["オプションが見つかりません"] } }

  let stripeProductId = existing.stripeProductId
  let stripePriceId = existing.stripePriceId

  if (data.status === "ACTIVE" && !stripeProductId) {
    try {
      const result = await ensureStripeProduct(id, data.name, data.description || null, data.price)
      stripeProductId = result.stripeProductId
      stripePriceId = result.stripePriceId
    } catch (e) {
      console.error("Stripe商品作成エラー:", e)
      return { error: { status: ["Stripe商品の作成に失敗しました"] } }
    }
  } else if (stripeProductId && stripePriceId && data.price !== existing.price) {
    try {
      stripePriceId = await updateStripePrice(stripeProductId, stripePriceId, data.price)
    } catch (e) {
      console.error("Stripe価格更新エラー:", e)
      return { error: { price: ["Stripe価格の更新に失敗しました"] } }
    }
  }

  if (stripeProductId) {
    try {
      const stripe = getStripe()
      await stripe.products.update(stripeProductId, {
        name: data.name,
        description: data.description || undefined,
      })
    } catch (e) {
      console.error("Stripe商品更新エラー:", e)
    }
  }

  await prisma.option.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description || null,
      category: data.category,
      price: data.price,
      imageUrl: data.imageUrl || null,
      deadline: data.deadline ? normalizeDeadline(data.deadline) : null,
      sortOrder: typeof data.sortOrder === "number" ? data.sortOrder : 0,
      status: data.status,
      stripeProductId,
      stripePriceId,
    },
  })

  revalidatePath("/admin/options")
  revalidatePath(`/admin/options/${id}`)
  updateTag("options")
  return { success: true }
}

export async function deleteOption(id: string) {
  const paidCount = await prisma.optionPurchase.count({
    where: { optionId: id, status: "PAID" },
  })
  if (paidCount > 0) {
    return { error: "支払済みの購入があるため削除できません" }
  }

  const option = await prisma.option.findUnique({ where: { id } })
  if (option?.stripeProductId) {
    try {
      const stripe = getStripe()
      await stripe.products.update(option.stripeProductId, { active: false })
    } catch (e) {
      console.error("Stripe商品アーカイブエラー:", e)
    }
  }

  await prisma.optionPurchase.deleteMany({ where: { optionId: id } })
  await prisma.option.delete({ where: { id } })
  revalidatePath("/admin/options")
  updateTag("options")
  return { success: true }
}
