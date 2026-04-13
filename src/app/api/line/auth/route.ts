import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getIronSession } from "iron-session"
import { sessionOptions, type SessionData } from "@/lib/session"
import crypto from "crypto"

const CHANNEL_ID = process.env.LINE_LOGIN_CHANNEL_ID
const REDIRECT_URI = process.env.NEXT_PUBLIC_BASE_URL
  ? `${process.env.NEXT_PUBLIC_BASE_URL}/api/line/callback`
  : "https://app.vozel.jp/api/line/callback"

export async function GET() {
  const cookieStore = await cookies()
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions)
  if (!session.talentId || session.role !== "talent") {
    return NextResponse.redirect(new URL("/auth/login", REDIRECT_URI))
  }

  if (!CHANNEL_ID) {
    return NextResponse.json({ error: "LINE_LOGIN_CHANNEL_ID未設定" }, { status: 500 })
  }

  const state = crypto.randomBytes(16).toString("hex")

  cookieStore.set("line_state", state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 300,
    path: "/",
  })

  const params = new URLSearchParams({
    response_type: "code",
    client_id: CHANNEL_ID,
    redirect_uri: REDIRECT_URI,
    state,
    scope: "profile openid",
    bot_prompt: "aggressive",
  })

  return NextResponse.redirect(`https://access.line.me/oauth2/v2.1/authorize?${params}`)
}
