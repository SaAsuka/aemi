"use server"

import { revalidatePath, updateTag } from "next/cache"
import { prisma } from "@/lib/db"
import { requireAgencyAdmin } from "@/lib/agency-auth"

export async function getAgencyInvoices(agencyId: string, status?: string) {
  const where: Record<string, unknown> = {
    application: { job: { agencyId } },
  }
  if (status && status !== "ALL") where.status = status

  return prisma.invoice.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      subject: true,
      amount: true,
      taxRate: true,
      status: true,
      issueDate: true,
      dueDate: true,
      freeeInvoiceNumber: true,
      productionCompany: { select: { id: true, companyName: true } },
      application: {
        select: {
          talent: { select: { name: true } },
          job: { select: { title: true } },
        },
      },
    },
  })
}

export async function getAgencyInvoice(id: string, agencyId: string) {
  return prisma.invoice.findFirst({
    where: { id, application: { job: { agencyId } } },
    include: {
      productionCompany: true,
      application: {
        include: {
          talent: { select: { name: true } },
          job: { select: { title: true, fee: true } },
        },
      },
    },
  })
}

export async function updateAgencyInvoiceStatus(id: string, status: string) {
  const agency = await requireAgencyAdmin()
  const validStatuses = ["DRAFT", "ISSUED", "SENT", "PAID", "CANCELLED"]
  if (!validStatuses.includes(status)) {
    return { error: "無効なステータスです" }
  }

  const existing = await prisma.invoice.findFirst({
    where: { id, application: { job: { agencyId: agency.id } } },
  })
  if (!existing) return { error: "請求書が見つかりません" }

  await prisma.invoice.update({
    where: { id },
    data: { status: status as "DRAFT" | "ISSUED" | "SENT" | "PAID" | "CANCELLED" },
  })

  revalidatePath("/agency/invoices")
  updateTag("invoices")
  return { success: true }
}
