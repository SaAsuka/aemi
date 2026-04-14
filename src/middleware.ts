import { NextRequest, NextResponse } from "next/server"
import { getIronSession } from "iron-session"
import { sessionOptions, type SessionData } from "@/lib/session"

export async function middleware(request: NextRequest) {
  if (!process.env.SESSION_SECRET) {
    return NextResponse.next()
  }

  const { pathname, searchParams } = request.nextUrl
  const response = NextResponse.next()

  const session = await getIronSession<SessionData>(request, response, sessionOptions)

  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    if (session.role !== "admin") {
      return NextResponse.redirect(new URL("/admin/login", request.url))
    }
  }

  if (pathname.startsWith("/jobs")) {
    const t = searchParams.get("t")
    if (t) return response

    if (!session.talentId || session.role !== "talent") {
      const loginUrl = new URL("/auth/login", request.url)
      loginUrl.searchParams.set("redirect", pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  if (pathname === "/subscribe" || pathname === "/setup" || pathname.startsWith("/mypage") || pathname === "/welcome") {
    if (!session.talentId || session.role !== "talent") {
      const loginUrl = new URL("/auth/login", request.url)
      loginUrl.searchParams.set("redirect", pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return response
}

export const config = {
  matcher: ["/admin/:path*", "/jobs/:path*", "/subscribe", "/setup", "/mypage/:path*", "/welcome"],
}
