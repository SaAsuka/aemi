"use server"

import { revalidatePath, updateTag } from "next/cache"
import { prisma } from "@/lib/db"
import { productionCompanySchema } from "@/lib/validations/production-company"
import { findOrCreateFreeePartner, isFreeeConnected, searchFreeePartners, getFreeeAccessToken, freeeFetch } from "@/lib/freee"
import type { FreeePartner } from "@/lib/freee"

export async function getProductionCompanies(search?: string) {
  const where = search
    ? {
        OR: [
          { companyName: { contains: search, mode: "insensitive" as const } },
          { contactName: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {}

  return prisma.productionCompany.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      companyName: true,
      contactName: true,
      contactEmail: true,
      contactPhone: true,
      freeePartnerId: true,
      _count: { select: { invoices: true } },
    },
  })
}

export async function getProductionCompany(id: string) {
  return prisma.productionCompany.findUnique({
    where: { id },
    include: {
      invoices: {
        select: {
          id: true,
          subject: true,
          amount: true,
          status: true,
          issueDate: true,
          dueDate: true,
          application: {
            select: {
              talent: { select: { name: true } },
              job: { select: { title: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  })
}

export async function getProductionCompanyList() {
  return prisma.productionCompany.findMany({
    orderBy: { companyName: "asc" },
    select: { id: true, companyName: true },
  })
}

export async function createProductionCompany(formData: FormData) {
  const raw = Object.fromEntries(formData)
  const parsed = productionCompanySchema.safeParse(raw)

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const data = parsed.data

  let freeePartnerId: number | null = null
  const connected = await isFreeeConnected()
  if (connected) {
    try {
      const partner = await findOrCreateFreeePartner(data.companyName, {
        zipCode: data.zipCode || undefined,
        address: data.address || undefined,
        contactName: data.contactName || undefined,
        email: data.contactEmail || undefined,
        phone: data.contactPhone || undefined,
      })
      freeePartnerId = partner.id
    } catch (e) {
      console.error("[ProductionCompany] Freee取引先登録失敗:", e)
      return { error: { companyName: ["Freeeへの取引先登録に失敗しました。Freee連携を確認してください。"] } }
    }
  }

  const created = await prisma.productionCompany.create({
    data: {
      companyName: data.companyName,
      zipCode: data.zipCode || null,
      address: data.address || null,
      contactName: data.contactName || null,
      contactEmail: data.contactEmail || null,
      contactPhone: data.contactPhone || null,
      freeePartnerId,
      note: data.note || null,
    },
  })

  revalidatePath("/admin/production-companies")
  updateTag("production-companies")
  return { success: true, id: created.id }
}

export async function updateProductionCompany(id: string, formData: FormData) {
  const raw = Object.fromEntries(formData)
  const parsed = productionCompanySchema.safeParse(raw)

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const data = parsed.data
  await prisma.productionCompany.update({
    where: { id },
    data: {
      companyName: data.companyName,
      zipCode: data.zipCode || null,
      address: data.address || null,
      contactName: data.contactName || null,
      contactEmail: data.contactEmail || null,
      contactPhone: data.contactPhone || null,
      note: data.note || null,
    },
  })

  revalidatePath("/admin/production-companies")
  revalidatePath(`/admin/production-companies/${id}`)
  updateTag("production-companies")
  return { success: true }
}

export async function syncFreeePartners(): Promise<{ synced: number; created: number; error?: string }> {
  const connected = await isFreeeConnected()
  if (!connected) {
    return { synced: 0, created: 0, error: "Freee未連携です" }
  }

  try {
    const { companyId } = await getFreeeAccessToken()
    const data = await freeeFetch<{ partners: FreeePartner[] }>(
      `/partners?company_id=${companyId}&limit=3000`
    )
    const partners = data.partners

    let created = 0
    for (const partner of partners) {
      const existing = await prisma.productionCompany.findUnique({
        where: { freeePartnerId: partner.id },
      })
      if (!existing) {
        await prisma.productionCompany.create({
          data: {
            companyName: partner.name,
            freeePartnerId: partner.id,
          },
        })
        created++
      }
    }

    revalidatePath("/admin/production-companies")
    updateTag("production-companies")
    return { synced: partners.length, created }
  } catch (e) {
    console.error("[Freee] 取引先同期失敗:", e)
    return { synced: 0, created: 0, error: "Freee取引先の同期に失敗しました" }
  }
}

export async function deleteProductionCompany(id: string) {
  const invoiceCount = await prisma.invoice.count({ where: { productionCompanyId: id } })
  if (invoiceCount > 0) {
    return { error: "請求書が紐づいているため削除できません" }
  }
  await prisma.productionCompany.delete({ where: { id } })
  revalidatePath("/admin/production-companies")
  updateTag("production-companies")
  return { success: true }
}
