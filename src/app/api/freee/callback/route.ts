import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { prisma } from "@/lib/db"

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://app.vozel.jp"
const REDIRECT_URI = `${BASE_URL}/api/freee/callback`

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code")
  const state = req.nextUrl.searchParams.get("state")
  const error = req.nextUrl.searchParams.get("error")

  console.log("[FREEE] コールバック受信:", { code: code?.slice(0, 10) + "...", state, error, BASE_URL, REDIRECT_URI })

  if (error) {
    console.error("[FREEE] 認証エラー:", error)
    return NextResponse.redirect(`${BASE_URL}/admin/settings?freee=error`)
  }

  const cookieStore = await cookies()
  const savedState = cookieStore.get("freee_state")?.value
  cookieStore.delete("freee_state")

  if (!code || !state || state !== savedState) {
    console.error("[FREEE] state不一致またはcode未取得:", { code: !!code, state, savedState })
    return NextResponse.redirect(`${BASE_URL}/admin/settings?freee=error`)
  }

  const clientId = process.env.FREEE_CLIENT_ID!
  const clientSecret = process.env.FREEE_CLIENT_SECRET!

  try {
    console.log("[FREEE] トークン取得開始...")
    const tokenRes = await fetch("https://accounts.secure.freee.co.jp/public_api/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: REDIRECT_URI,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    })

    if (!tokenRes.ok) {
      const err = await tokenRes.text()
      console.error("[FREEE] トークン取得失敗:", tokenRes.status, err)
      return NextResponse.redirect(`${BASE_URL}/admin/settings?freee=error`)
    }

    const data = await tokenRes.json()
    console.log("[FREEE] トークン取得成功:", {
      hasAccessToken: !!data.access_token,
      hasRefreshToken: !!data.refresh_token,
      expiresIn: data.expires_in,
      companyId: data.company_id,
      scope: data.scope,
    })

    let companyId = data.company_id as number | undefined

    if (!companyId) {
      console.log("[FREEE] token responseにcompany_id無し → /api/1/companies で取得...")
      const companiesRes = await fetch("https://api.freee.co.jp/api/1/companies", {
        headers: {
          Authorization: `Bearer ${data.access_token}`,
          "Content-Type": "application/json",
        },
      })

      if (companiesRes.ok) {
        const companiesData = await companiesRes.json()
        console.log("[FREEE] /companies レスポンス:", JSON.stringify(companiesData))

        if (companiesData.companies && companiesData.companies.length > 0) {
          companyId = companiesData.companies[0].id as number
          console.log("[FREEE] 会社取得成功:", { companyId, name: companiesData.companies[0].display_name })
        } else {
          console.error("[FREEE] 会社一覧が空です")
        }
      } else {
        const errBody = await companiesRes.text()
        console.error("[FREEE] /companies 失敗:", companiesRes.status, errBody)
      }
    }

    if (!companyId) {
      console.error("[FREEE] company_id を取得できませんでした")
      return NextResponse.redirect(`${BASE_URL}/admin/settings?freee=error`)
    }

    console.log("[FREEE] DB保存開始:", { companyId })
    await prisma.freeeToken.upsert({
      where: { companyId },
      create: {
        companyId,
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: new Date(Date.now() + data.expires_in * 1000),
      },
      update: {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: new Date(Date.now() + data.expires_in * 1000),
      },
    })

    console.log(`[FREEE] 連携成功 companyId=${companyId}`)
    return NextResponse.redirect(`${BASE_URL}/admin/settings?freee=connected`)
  } catch (e) {
    console.error("[FREEE] エラー:", e)
    return NextResponse.redirect(`${BASE_URL}/admin/settings?freee=error`)
  }
}
