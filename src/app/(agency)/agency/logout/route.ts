import { NextResponse } from "next/server"
import { agencyLogout } from "@/lib/actions/agency-auth"

export async function GET() {
  await agencyLogout()
  return NextResponse.redirect(new URL("/agency/login", process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"))
}
