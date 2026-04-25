import { NextResponse } from "next/server"
import { cookies } from "next/headers"

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://app.vozel.jp"

export async function GET() {
  const clientId = process.env.FREEE_CLIENT_ID
  if (!clientId) {
    return NextResponse.json({ error: "FREEE_CLIENT_ID未設定" }, { status: 500 })
  }

  const state = crypto.randomUUID()
  const cookieStore = await cookies()
  cookieStore.set("freee_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 300,
    path: "/",
    sameSite: "lax",
  })

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: `${BASE_URL}/api/freee/callback`,
    state,
    prompt: "consent",
  })

  return NextResponse.redirect(
    `https://accounts.secure.freee.co.jp/public_api/authorize?${params}`
  )
}
