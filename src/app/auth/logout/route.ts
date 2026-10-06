import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"

export async function GET() {
  const session = await getSession()
  // タレント画面と共用のため、ログアウト前の役割で戻り先のログイン画面を分ける
  const loginPath = session.role === "admin" ? "/admin/login" : "/auth/login"
  session.destroy()
  return NextResponse.redirect(new URL(loginPath, process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"))
}
