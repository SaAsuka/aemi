"use client"

import { useState } from "react"
import Link, { useLinkStatus } from "next/link"
import { usePathname } from "next/navigation"
import { User, Briefcase, Settings, LogOut, Menu, X, BookOpen, Loader2, type LucideIcon } from "lucide-react"

// 押してから画面が切り替わるまでの間、アイコンをくるくるに変えて「反応している」ことを伝える（管理画面と同じ）
function NavIcon({ icon: Icon }: { icon: LucideIcon }) {
  const { pending } = useLinkStatus()
  return pending ? (
    <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden="true" />
  ) : (
    <Icon className="size-4 shrink-0" aria-hidden="true" />
  )
}

export function TalentNav({ talentName }: { talentName: string }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const links = [
    { href: "/mypage", label: "マイページ", icon: User },
    { href: "/jobs", label: "案件一覧", icon: Briefcase },
    { href: "/mypage/options", label: "レッスン一覧", icon: BookOpen },
    { href: "/mypage/settings", label: "設定", icon: Settings },
  ]

  const isActive = (href: string) =>
    href === "/mypage" ? pathname === href : pathname === href || pathname.startsWith(href + "/")

  return (
    <nav
      aria-label="メインメニュー"
      className="sticky top-0 z-40 border-b border-neutral-200 bg-white pt-[env(safe-area-inset-top)] text-neutral-950"
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4">
        <Link
          href="/mypage"
          className="shrink-0 rounded-sm text-base font-bold tracking-[0.2em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950/30"
        >
          VOZEL
        </Link>

        {/* PC */}
        <div className="hidden min-w-0 items-center gap-1 sm:flex">
          {links.map(({ href, label, icon }) => (
            <Link
              key={href}
              href={href}
              aria-current={isActive(href) ? "page" : undefined}
              className={`flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950/30 ${
                isActive(href)
                  ? "bg-neutral-100 font-medium text-neutral-950"
                  : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-950"
              }`}
            >
              <NavIcon icon={icon} />
              <span>{label}</span>
            </Link>
          ))}
          <span className="mx-2 h-5 w-px bg-neutral-200" aria-hidden="true" />
          <span className="max-w-[160px] truncate text-sm text-neutral-500" title={talentName}>
            {talentName}
          </span>
          <a
            href="/auth/logout"
            className="flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm text-neutral-500 transition-colors hover:bg-neutral-50 hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950/30"
          >
            <LogOut className="size-4" aria-hidden="true" />
            <span>ログアウト</span>
          </a>
        </div>

        {/* SP ハンバーガー */}
        <button
          type="button"
          className="-mr-2 flex size-10 items-center justify-center rounded-lg text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950/30 sm:hidden"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-controls="talent-nav-menu"
          aria-label={open ? "メニューを閉じる" : "メニューを開く"}
        >
          {open ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
        </button>
      </div>

      {/* SP メニュー */}
      {open && (
        <div id="talent-nav-menu" className="border-t border-neutral-200 bg-white shadow-lg shadow-neutral-950/5 sm:hidden">
          <p className="truncate px-4 pb-1 pt-3 text-xs text-neutral-500">{talentName}</p>
          <div className="space-y-0.5 px-2 pb-2">
            {links.map(({ href, label, icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                aria-current={isActive(href) ? "page" : undefined}
                className={`flex h-11 items-center gap-3 rounded-lg px-3 text-[15px] transition-colors ${
                  isActive(href)
                    ? "bg-neutral-950 font-medium text-white"
                    : "text-neutral-700 hover:bg-neutral-100 hover:text-neutral-950"
                }`}
              >
                <NavIcon icon={icon} />
                <span>{label}</span>
              </Link>
            ))}
          </div>
          <div className="border-t border-neutral-100 px-2 py-2">
            <a
              href="/auth/logout"
              className="flex h-11 items-center gap-3 rounded-lg px-3 text-[15px] text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-950"
            >
              <LogOut className="size-4" aria-hidden="true" />
              <span>ログアウト</span>
            </a>
          </div>
        </div>
      )}
    </nav>
  )
}
