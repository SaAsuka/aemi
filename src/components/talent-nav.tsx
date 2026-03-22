"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { User, Briefcase, LogOut } from "lucide-react"

export function TalentNav({ talentName }: { talentName: string }) {
  const pathname = usePathname()

  const links = [
    { href: "/mypage", label: "マイページ", icon: User },
    { href: "/jobs", label: "案件一覧", icon: Briefcase },
  ]

  return (
    <nav className="border-b bg-background">
      <div className="mx-auto max-w-2xl px-4 flex items-center justify-between h-14">
        <div className="flex items-center gap-6">
          <span className="font-semibold text-sm">{talentName}</span>
          <div className="flex items-center gap-4">
            {links.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 text-sm transition-colors ${
                  pathname === href || pathname.startsWith(href + "/")
                    ? "text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </div>
        </div>
        <a
          href="/auth/logout"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <LogOut className="h-4 w-4" />
          ログアウト
        </a>
      </div>
    </nav>
  )
}
