"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { User, Briefcase, Settings, LogOut, Menu, X } from "lucide-react"

export function TalentNav({ talentName }: { talentName: string }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const links = [
    { href: "/mypage", label: "マイページ", icon: User },
    { href: "/jobs", label: "案件一覧", icon: Briefcase },
    { href: "/mypage/settings", label: "設定", icon: Settings },
  ]

  const isActive = (href: string) =>
    href === "/mypage" ? pathname === href : pathname === href || pathname.startsWith(href + "/")

  return (
    <nav className="border-b bg-background sticky top-0 z-40">
      <div className="mx-auto max-w-7xl px-3 sm:px-4 flex items-center justify-between h-12 sm:h-14">
        <span className="font-semibold text-sm truncate max-w-[150px]">{talentName}</span>

        {/* PC */}
        <div className="hidden sm:flex items-center gap-4">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-1.5 text-sm px-3 py-2 rounded-md transition-colors ${
                isActive(href)
                  ? "text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{label}</span>
            </Link>
          ))}
          <a
            href="/auth/logout"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
          >
            <LogOut className="h-4 w-4" />
            <span>ログアウト</span>
          </a>
        </div>

        {/* SP ハンバーガー */}
        <button
          className="sm:hidden p-2 -mr-2 text-muted-foreground hover:text-foreground"
          onClick={() => setOpen(!open)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* SP メニュー */}
      {open && (
        <div className="sm:hidden border-t bg-background">
          <div className="px-3 py-2 space-y-1">
            {links.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 text-sm px-3 py-3 rounded-md transition-colors ${
                  isActive(href)
                    ? "text-foreground font-medium bg-muted"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{label}</span>
              </Link>
            ))}
            <a
              href="/auth/logout"
              className="flex items-center gap-3 text-sm px-3 py-3 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>ログアウト</span>
            </a>
          </div>
        </div>
      )}
    </nav>
  )
}
