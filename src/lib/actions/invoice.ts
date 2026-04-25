"use server"

import { revalidatePath, updateTag } from "next/cache"
import { prisma } from "@/lib/db"
import {
  createFreeeInvoice,
  isFreeeConnected,
} from "@/lib/freee"

export async function getInvoices(status?: string) {
  const where: Record<string, unknown> = {}
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

export async function getInvoice(id: string) {
  return prisma.invoice.findUnique({
    where: { id },
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

type CreateInvoiceInput = {
  applicationId: string
  productionCompanyId: string
  subject: string
  description: string
  amount: number
  taxRate: number
  issueDate: string
  dueDate: string
}

export async function createInvoice(input: CreateInvoiceInput) {
  const connected = await isFreeeConnected()
  if (!connected) {
    return { error: "Freee未連携です。設定画面から連携してください。" }
  }

  const existing = await prisma.invoice.findMany({
    where: {
      applicationId: input.applicationId,
      status: { not: "CANCELLED" },
    },
  })
  if (existing.length > 0) {
    await prisma.invoice.updateMany({
      where: {
        applicationId: input.applicationId,
        status: { not: "CANCELLED" },
      },
      data: { status: "CANCELLED" },
    })
  }

  const company = await prisma.productionCompany.findUnique({
    where: { id: input.productionCompanyId },
  })
  if (!company) {
    return { error: "制作会社が見つかりません" }
  }

  const freeePartnerId = company.freeePartnerId
  if (!freeePartnerId) {
    return { error: "この制作会社はFreee未連携です。制作会社管理から再登録してください。" }
  }

  try {
    const freeeResult = await createFreeeInvoice({
      partnerId: freeePartnerId,
      issueDate: input.issueDate,
      dueDate: input.dueDate,
      subject: input.subject,
      description: input.description,
      amount: input.amount,
      taxRate: input.taxRate,
    })

    const invoice = await prisma.invoice.create({
      data: {
        applicationId: input.applicationId,
        productionCompanyId: input.productionCompanyId,
        subject: input.subject,
        description: input.description,
        amount: input.amount,
        taxRate: input.taxRate,
        issueDate: new Date(input.issueDate),
        dueDate: new Date(input.dueDate),
        freeeInvoiceId: freeeResult.invoice.id,
        freeeInvoiceNumber: freeeResult.invoice.invoice_number,
        status: "ISSUED",
      },
    })

    revalidatePath("/admin/applications")
    revalidatePath("/admin/invoices")
    updateTag("invoices")
    return { success: true, invoiceId: invoice.id }
  } catch (e) {
    console.error("[Invoice] Freee請求書作成失敗:", e)
    return { error: "Freeeでの請求書作成に失敗しました" }
  }
}

export async function updateInvoiceStatus(id: string, status: string) {
  const validStatuses = ["DRAFT", "ISSUED", "SENT", "PAID", "CANCELLED"]
  if (!validStatuses.includes(status)) {
    return { error: "無効なステータスです" }
  }

  await prisma.invoice.update({
    where: { id },
    data: { status: status as "DRAFT" | "ISSUED" | "SENT" | "PAID" | "CANCELLED" },
  })

  revalidatePath("/admin/invoices")
  updateTag("invoices")
  return { success: true }
}
