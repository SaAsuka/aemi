"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { User, Briefcase, Settings, LogOut } from "lucide-react"

export function TalentNav({ talentName }: { talentName: string }) {
  const pathname = usePathname()

  const links = [
    { href: "/mypage", label: "マイページ", icon: User },
    { href: "/jobs", label: "案件一覧", icon: Briefcase },
    { href: "/mypage/settings", label: "設定", icon: Settings },
  ]

  return (
    <nav className="border-b bg-background sticky top-0 z-40">
      <div className="mx-auto max-w-7xl px-3 sm:px-4 flex items-center justify-between h-12 sm:h-14">
        <div className="flex items-center gap-1 sm:gap-6 min-w-0">
          <span className="font-semibold text-sm hidden sm:block truncate max-w-[120px]">{talentName}</span>
          <div className="flex items-center gap-1 sm:gap-4">
            {links.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 text-sm px-3 py-2 rounded-md transition-colors ${
                  (href === "/mypage" ? pathname === href : pathname === href || pathname.startsWith(href + "/"))
                    ? "text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{label}</span>
              </Link>
            ))}
          </div>
        </div>
        <a
          href="/auth/logout"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors shrink-0 py-2"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">ログアウト</span>
        </a>
      </div>
    </nav>
  )
}
