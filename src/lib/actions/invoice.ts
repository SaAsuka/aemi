"use server"

import { revalidatePath, updateTag } from "next/cache"
import { prisma } from "@/lib/db"
import { requireAdmin } from "@/lib/auth"
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
    return { error: "freeeと連携していません。設定ページでfreeeと連携してください。" }
  }

  const company = await prisma.productionCompany.findUnique({
    where: { id: input.productionCompanyId },
  })
  if (!company) {
    return { error: "制作会社が見つかりません" }
  }

  const freeePartnerId = company.freeePartnerId
  if (!freeePartnerId) {
    return { error: "この制作会社はfreeeと連携していません。freeeと連携した状態で、制作会社管理から登録し直してください。" }
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

    // freeeで発行できてから、前の請求書（取消以外）を取消にして新しい請求書を登録する。
    // 先に取消にすると、発行に失敗したとき請求書が1枚も無い状態になるため
    const [, invoice] = await prisma.$transaction([
      prisma.invoice.updateMany({
        where: { applicationId: input.applicationId, status: { not: "CANCELLED" } },
        data: { status: "CANCELLED" },
      }),
      prisma.invoice.create({
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
      }),
    ])

    revalidatePath("/admin/applications")
    revalidatePath("/admin/invoices")
    updateTag("invoices")
    return { success: true, invoiceId: invoice.id }
  } catch (e) {
    console.error("[Invoice] Freee請求書作成失敗:", e)
    return { error: "freeeで請求書を作成できませんでした。少し時間をおいて、もう一度お試しください。" }
  }
}

export async function updateInvoiceStatus(id: string, status: string) {
  // 管理画面の一覧から呼ぶので、管理者以外は受け付けない
  await requireAdmin()
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
