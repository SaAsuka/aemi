import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getIronSession } from "iron-session"
import { sessionOptions, type SessionData } from "@/lib/session"
import { prisma } from "@/lib/db"

const CHANNEL_ID = process.env.LINE_LOGIN_CHANNEL_ID
const CHANNEL_SECRET = process.env.LINE_LOGIN_CHANNEL_SECRET
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://app.vozel.jp"
const REDIRECT_URI = `${BASE_URL}/api/line/callback`

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code")
  const state = req.nextUrl.searchParams.get("state")
  const error = req.nextUrl.searchParams.get("error")

  if (error) {
    console.error("[LINE_LOGIN] 認証エラー:", error)
    return NextResponse.redirect(`${BASE_URL}/mypage/settings?line=error`)
  }

  const cookieStore = await cookies()
  const savedState = cookieStore.get("line_state")?.value
  cookieStore.delete("line_state")

  if (!code || !state || state !== savedState) {
    console.error("[LINE_LOGIN] state不一致またはcode未取得")
    return NextResponse.redirect(`${BASE_URL}/mypage/settings?line=error`)
  }

  const session = await getIronSession<SessionData>(cookieStore, sessionOptions)
  if (!session.talentId || session.role !== "talent") {
    return NextResponse.redirect(`${BASE_URL}/auth/login`)
  }

  try {
    const tokenRes = await fetch("https://api.line.me/oauth2/v2.1/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: REDIRECT_URI,
        client_id: CHANNEL_ID!,
        client_secret: CHANNEL_SECRET!,
      }),
    })

    if (!tokenRes.ok) {
      const err = await tokenRes.json().catch(() => ({}))
      console.error("[LINE_LOGIN] トークン取得失敗:", err)
      return NextResponse.redirect(`${BASE_URL}/mypage/settings?line=error`)
    }

    const { access_token } = await tokenRes.json()

    const profileRes = await fetch("https://api.line.me/v2/profile", {
      headers: { Authorization: `Bearer ${access_token}` },
    })

    if (!profileRes.ok) {
      console.error("[LINE_LOGIN] プロフィール取得失敗")
      return NextResponse.redirect(`${BASE_URL}/mypage/settings?line=error`)
    }

    const { userId } = await profileRes.json()

    await prisma.talent.update({
      where: { id: session.talentId },
      data: { lineUserId: userId },
    })

    console.log(`[LINE_LOGIN] 連携成功 talentId=${session.talentId} lineUserId=${userId}`)
    return NextResponse.redirect(`${BASE_URL}/mypage/settings?line=connected`)
  } catch (e) {
    console.error("[LINE_LOGIN] エラー:", e)
    return NextResponse.redirect(`${BASE_URL}/mypage/settings?line=error`)
  }
}
