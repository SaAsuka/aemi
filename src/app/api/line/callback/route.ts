import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getIronSession } from "iron-session"
import { sessionOptions, type SessionData } from "@/lib/session"
import { prisma } from "@/lib/db"
import { verifyLineState } from "@/lib/line-state"
import { lineLogger } from "@logs/line"
import { trackEvent } from "@/lib/track-event"

const CHANNEL_ID = process.env.LINE_LOGIN_CHANNEL_ID
const CHANNEL_SECRET = process.env.LINE_LOGIN_CHANNEL_SECRET
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://app.vozel.jp"
const REDIRECT_URI = `${BASE_URL}/api/line/callback`

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code")
  const state = req.nextUrl.searchParams.get("state")
  const error = req.nextUrl.searchParams.get("error")

  const cookieStore = await cookies()
  const savedState = cookieStore.get("line_state")?.value
  const cookieReturnTo = cookieStore.get("line_return_to")?.value || ""
  cookieStore.delete("line_state")
  cookieStore.delete("line_return_to")

  // Cookieが無い＝連携ボタンを押したのとは別のドメイン/ブラウザで戻ってきた。
  // その場合はマイページを開いてもログイン画面になるので、ログイン不要の完了画面へ案内する
  const viaSignedState = !savedState
  const errorDest = viaSignedState
    ? `${BASE_URL}/line-connected?status=error`
    : `${BASE_URL}/mypage/settings?line=error`

  if (error) {
    lineLogger.error("auth_denied", { lineError: error, viaSignedState })
    return NextResponse.redirect(errorDest)
  }

  if (!code || !state) {
    lineLogger.error("missing_params", { hasCode: !!code, hasState: !!state })
    return NextResponse.redirect(errorDest)
  }

  let talentId: string
  let returnTo = ""

  if (!viaSignedState) {
    // 従来どおり、連携ボタンを押したブラウザのCookieで照合する
    if (state !== savedState) {
      lineLogger.error("state_mismatch", { hasCode: true, hasState: true })
      return NextResponse.redirect(errorDest)
    }
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions)
    if (!session.talentId || session.role !== "talent") {
      return NextResponse.redirect(`${BASE_URL}/auth/login`)
    }
    talentId = session.talentId
    returnTo = cookieReturnTo
  } else {
    const verified = verifyLineState(state, process.env.SESSION_SECRET!)
    if (!verified) {
      lineLogger.error("signed_state_invalid", {})
      return NextResponse.redirect(errorDest)
    }
    talentId = verified.talentId
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
      lineLogger.error("token_fetch_failed", { talentId, status: tokenRes.status, detail: err })
      return NextResponse.redirect(errorDest)
    }

    const { access_token } = await tokenRes.json()

    const profileRes = await fetch("https://api.line.me/v2/profile", {
      headers: { Authorization: `Bearer ${access_token}` },
    })

    if (!profileRes.ok) {
      lineLogger.error("profile_fetch_failed", { talentId, status: profileRes.status })
      return NextResponse.redirect(errorDest)
    }

    const { userId } = await profileRes.json()

    await prisma.talent.update({
      where: { id: talentId },
      data: { lineUserId: userId },
    })

    trackEvent("line_connected", { userId: talentId, userType: "talent" })
    lineLogger.info("connect_success", { talentId, lineUserId: userId, viaSignedState })

    if (viaSignedState) return NextResponse.redirect(`${BASE_URL}/line-connected`)
    const successDest = returnTo ? `${BASE_URL}${returnTo}` : `${BASE_URL}/mypage/settings?line=connected`
    return NextResponse.redirect(successDest)
  } catch (e) {
    lineLogger.error("unexpected_error", { talentId, error: String(e) })
    return NextResponse.redirect(errorDest)
  }
}
