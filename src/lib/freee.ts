import { prisma } from "@/lib/db"

const FREEE_TOKEN_URL = "https://accounts.secure.freee.co.jp/public_api/token"
const FREEE_API_BASE = "https://api.freee.co.jp/api/1"

function getFreeeCredentials() {
  const clientId = process.env.FREEE_CLIENT_ID
  const clientSecret = process.env.FREEE_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    throw new Error("FREEE_CLIENT_ID / FREEE_CLIENT_SECRET が設定されていません")
  }
  return { clientId, clientSecret }
}

async function refreshAccessToken(token: {
  id: string
  companyId: number
  refreshToken: string
}): Promise<string> {
  const { clientId, clientSecret } = getFreeeCredentials()

  const res = await fetch(FREEE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: token.refreshToken,
    }),
    signal: AbortSignal.timeout(15000),
  })

  if (!res.ok) {
    const body = await res.text()
    console.error("[Freee] トークンリフレッシュ失敗:", res.status, body)
    throw new Error("Freeeトークンのリフレッシュに失敗しました。再連携してください。")
  }

  const data = await res.json()
  await prisma.freeeToken.update({
    where: { id: token.id },
    data: {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: new Date(Date.now() + data.expires_in * 1000),
    },
  })

  return data.access_token as string
}

export async function getFreeeAccessToken(): Promise<{ accessToken: string; companyId: number }> {
  const token = await prisma.freeeToken.findFirst()
  if (!token) {
    throw new Error("Freee未連携です。設定画面からFreeeと連携してください。")
  }

  const bufferMs = 5 * 60 * 1000
  if (token.expiresAt.getTime() < Date.now() + bufferMs) {
    const newAccessToken = await refreshAccessToken(token)
    return { accessToken: newAccessToken, companyId: token.companyId }
  }

  return { accessToken: token.accessToken, companyId: token.companyId }
}

export async function freeeFetch<T>(
  path: string,
  options?: { method?: string; body?: Record<string, unknown> }
): Promise<T> {
  const { accessToken } = await getFreeeAccessToken()
  const method = options?.method ?? "GET"

  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  }

  const res = await fetch(`${FREEE_API_BASE}${path}`, {
    method,
    headers,
    body: options?.body ? JSON.stringify(options.body) : undefined,
    signal: AbortSignal.timeout(15000),
  })

  if (!res.ok) {
    const body = await res.text()
    console.error(`[Freee] API エラー: ${method} ${path}`, res.status, body)
    throw new Error(`Freee API エラー (${res.status})`)
  }

  return res.json() as Promise<T>
}

export async function isFreeeConnected(): Promise<boolean> {
  const token = await prisma.freeeToken.findFirst()
  return !!token
}

export type FreeePartner = {
  id: number
  code: string | null
  name: string
  long_name: string | null
}

export type FreeeInvoiceResponse = {
  invoice: {
    id: number
    invoice_number: string
    billing_date: string
    issue_date: string
    due_date: string
    total_amount: number
    amount_excluding_tax: number
    partner_id: number
    sending_status: string
    payment_status: string
  }
}

export async function searchFreeePartners(keyword: string): Promise<FreeePartner[]> {
  const { companyId } = await getFreeeAccessToken()
  const data = await freeeFetch<{ partners: FreeePartner[] }>(
    `/partners?company_id=${companyId}&keyword=${encodeURIComponent(keyword)}&limit=50`
  )
  return data.partners
}

export async function findOrCreateFreeePartner(name: string, opts?: {
  zipCode?: string
  address?: string
  contactName?: string
  email?: string
  phone?: string
}): Promise<FreeePartner> {
  const existing = await searchFreeePartners(name)
  const exact = existing.find((p) => p.name === name)
  if (exact) return exact

  const { companyId } = await getFreeeAccessToken()
  const data = await freeeFetch<{ partner: FreeePartner }>("/partners", {
    method: "POST",
    body: {
      company_id: companyId,
      name,
      ...(opts?.zipCode || opts?.address
        ? {
            address_attributes: {
              ...(opts.zipCode ? { zipcode: opts.zipCode } : {}),
              ...(opts.address ? { street_name1: opts.address } : {}),
            },
          }
        : {}),
      ...(opts?.contactName ? { contact_name: opts.contactName } : {}),
      ...(opts?.email ? { email: opts.email } : {}),
      ...(opts?.phone ? { phone: opts.phone } : {}),
    },
  })
  return data.partner
}

const FREEE_INVOICE_API = "https://api.freee.co.jp/iv"

export async function createFreeeInvoice(params: {
  partnerId: number
  issueDate: string
  dueDate: string
  subject: string
  description: string
  amount: number
  taxRate: number
}): Promise<FreeeInvoiceResponse> {
  const { accessToken, companyId } = await getFreeeAccessToken()

  const res = await fetch(`${FREEE_INVOICE_API}/invoices`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      company_id: companyId,
      partner_id: params.partnerId,
      issue_date: params.issueDate,
      billing_date: params.issueDate,
      due_date: params.dueDate,
      payment_date: params.dueDate,
      subject: params.subject,
      tax_entry_method: "out",
      tax_fraction: "round",
      withholding_tax_entry_method: "out",
      partner_title: "御中",
      lines: [
        {
          type: "item",
          description: params.description || params.subject,
          unit_price: String(params.amount),
          quantity: "1",
          tax_rate: String(params.taxRate),
          reduced_vat: false,
        },
      ],
    }),
    signal: AbortSignal.timeout(15000),
  })

  if (!res.ok) {
    const body = await res.text()
    console.error("[Freee] 請求書作成エラー:", res.status, body)
    throw new Error(`Freee請求書作成エラー (${res.status})`)
  }

  return res.json() as Promise<FreeeInvoiceResponse>
}
