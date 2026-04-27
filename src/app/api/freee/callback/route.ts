import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { prisma } from "@/lib/db"

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://app.vozel.jp"
const REDIRECT_URI = `${BASE_URL}/api/freee/callback`

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code")
  const state = req.nextUrl.searchParams.get("state")
  const error = req.nextUrl.searchParams.get("error")

  if (error) {
    console.error("[FREEE] 認証エラー:", error)
    return NextResponse.redirect(`${BASE_URL}/admin/settings?freee=error`)
  }

  const cookieStore = await cookies()
  const savedState = cookieStore.get("freee_state")?.value
  cookieStore.delete("freee_state")

  if (!code || !state || state !== savedState) {
    console.error("[FREEE] state不一致またはcode未取得")
    return NextResponse.redirect(`${BASE_URL}/admin/settings?freee=error`)
  }

  const clientId = process.env.FREEE_CLIENT_ID!
  const clientSecret = process.env.FREEE_CLIENT_SECRET!

  try {
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
      console.error("[FREEE] トークン取得失敗:", err)
      return NextResponse.redirect(`${BASE_URL}/admin/settings?freee=error`)
    }

    const data = await tokenRes.json()
    let companyId = data.company_id as number | undefined

    if (!companyId) {
      const meRes = await fetch("https://api.freee.co.jp/api/1/users/me", {
        headers: { Authorization: `Bearer ${data.access_token}` },
      })
      if (meRes.ok) {
        const meData = await meRes.json()
        console.log("[FREEE] /users/me レスポンス:", JSON.stringify(meData))
        companyId = meData.user?.companies?.[0]?.id as number | undefined
      } else {
        const errBody = await meRes.text()
        console.error("[FREEE] /users/me 失敗:", meRes.status, errBody)
      }
    }

    if (!companyId) {
      console.error("[FREEE] company_id を取得できませんでした (token response:", JSON.stringify(data), ")")
      return NextResponse.redirect(`${BASE_URL}/admin/settings?freee=error`)
    }

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
