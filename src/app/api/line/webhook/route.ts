import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const body = await req.json()
  const events = body.events ?? []

  for (const event of events) {
    console.log(`[LINE_WEBHOOK] type=${event.type} userId=${event.source?.userId}`)
  }

  return NextResponse.json({ ok: true })
}
