"use server"

import { requireAdmin } from "@/lib/auth"
import { revalidatePath, updateTag } from "next/cache"
import { prisma } from "@/lib/db"
import { productionCompanySchema } from "@/lib/validations/production-company"
import { findOrCreateFreeePartner, isFreeeConnected, searchFreeePartners, getFreeeAccessToken, freeeFetch } from "@/lib/freee"
import type { FreeePartner } from "@/lib/freee"

export async function getProductionCompanies(search?: string) {
  await requireAdmin()
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
  await requireAdmin()
  return prisma.productionCompany.findUnique({
    where: { id },
    include: {
      invoices: {
        select: {
          id: true,
          subject: true,
          amount: true,
          taxRate: true,
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
  await requireAdmin()
  return prisma.productionCompany.findMany({
    orderBy: { companyName: "asc" },
    select: { id: true, companyName: true },
  })
}

export async function createProductionCompany(formData: FormData) {
  await requireAdmin()
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
      return { error: { companyName: ["freeeへの取引先登録に失敗しました。freeeとの連携を確認してください。"] } }
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
  await requireAdmin()
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

export async function syncFreeePartners(): Promise<{ synced: number; created: number; linked?: number; error?: string }> {
  await requireAdmin()
  const connected = await isFreeeConnected()
  if (!connected) {
    return { synced: 0, created: 0, error: "freeeと連携していません" }
  }

  try {
    const { companyId } = await getFreeeAccessToken()
    const data = await freeeFetch<{ partners: FreeePartner[] }>(
      `/partners?company_id=${companyId}&limit=3000`
    )
    const partners = data.partners

    let created = 0
    let linked = 0
    for (const partner of partners) {
      const existing = await prisma.productionCompany.findUnique({
        where: { freeePartnerId: partner.id },
      })
      if (existing) continue
      // 同じ名前でまだfreeeと結び付いていない会社があれば、新しく作らずにその会社と結び付ける（二重登録を防ぐ）
      const sameName = await prisma.productionCompany.findFirst({
        where: { companyName: partner.name, freeePartnerId: null },
        orderBy: { createdAt: "asc" },
      })
      if (sameName) {
        await prisma.productionCompany.update({ where: { id: sameName.id }, data: { freeePartnerId: partner.id } })
        linked++
        continue
      }
      await prisma.productionCompany.create({
        data: {
          companyName: partner.name,
          freeePartnerId: partner.id,
        },
      })
      created++
    }

    revalidatePath("/admin/production-companies")
    updateTag("production-companies")
    return { synced: partners.length, created, linked }
  } catch (e) {
    console.error("[Freee] 取引先同期失敗:", e)
    return { synced: 0, created: 0, error: "freeeの取引先を取り込めませんでした" }
  }
}

// freeeと連携する前に登録した会社を、あとからfreeeの取引先と結び付ける
// （同じ名前の取引先がfreeeにあればそれと、無ければfreeeに新しく取引先を作って結び付ける）
export async function linkProductionCompanyToFreee(id: string) {
  await requireAdmin()
  if (!(await isFreeeConnected())) {
    return { error: "freeeと連携していません。設定ページでfreeeと連携してください。" }
  }
  const company = await prisma.productionCompany.findUnique({ where: { id } })
  if (!company) return { error: "制作会社が見つかりません" }
  if (company.freeePartnerId) return { success: true, partnerId: company.freeePartnerId }

  let partner: FreeePartner
  try {
    partner = await findOrCreateFreeePartner(company.companyName, {
      zipCode: company.zipCode || undefined,
      address: company.address || undefined,
      contactName: company.contactName || undefined,
      email: company.contactEmail || undefined,
      phone: company.contactPhone || undefined,
    })
  } catch (e) {
    console.error("[ProductionCompany] freee取引先の結び付け失敗:", e)
    return { error: "freeeに取引先を登録できませんでした。少し時間をおいて、もう一度お試しください。" }
  }

  const other = await prisma.productionCompany.findUnique({ where: { freeePartnerId: partner.id } })
  if (other && other.id !== id) {
    return {
      error: `freeeの取引先「${partner.name}」は、すでに別の制作会社「${other.companyName}」と結び付いています。同じ会社が二重に登録されていないか確認してください。`,
    }
  }

  await prisma.productionCompany.update({ where: { id }, data: { freeePartnerId: partner.id } })
  revalidatePath("/admin/production-companies")
  revalidatePath(`/admin/production-companies/${id}`)
  updateTag("production-companies")
  return { success: true, partnerId: partner.id }
}

export async function deleteProductionCompany(id: string) {
  await requireAdmin()
  const invoiceCount = await prisma.invoice.count({ where: { productionCompanyId: id } })
  if (invoiceCount > 0) {
    return { error: "請求書が紐づいているため削除できません" }
  }
  await prisma.productionCompany.delete({ where: { id } })
  revalidatePath("/admin/production-companies")
  updateTag("production-companies")
  return { success: true }
}
