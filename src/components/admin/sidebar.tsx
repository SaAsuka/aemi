"use client"

import { useEffect, useState } from "react"
import Link, { useLinkStatus } from "next/link"
import { usePathname } from "next/navigation"
import { Dialog } from "@base-ui/react/dialog"
import {
  ArrowUpRight,
  BarChart3,
  Briefcase,
  Building2,
  CreditCard,
  CalendarDays,
  FileText,
  Globe,
  Loader2,
  LogOut,
  Menu,
  Receipt,
  Settings,
  ShoppingBag,
  Users,
  X,
  type LucideIcon,
} from "lucide-react"
import { LumitalLogo } from "@/components/brand/lumital-logo"

const navItems = [
  { title: "ダッシュボード", href: "/admin", icon: BarChart3 },
  { title: "タレント管理", href: "/admin/talents", icon: Users },
  { title: "案件管理", href: "/admin/jobs", icon: Briefcase },
  { title: "応募管理", href: "/admin/applications", icon: FileText },
  { title: "スケジュール", href: "/admin/schedule", icon: CalendarDays },
  { title: "オプション管理", href: "/admin/options", icon: ShoppingBag },
  { title: "制作会社", href: "/admin/production-companies", icon: Building2 },
  { title: "請求書", href: "/admin/invoices", icon: Receipt },
]

const ITEM =
  "flex h-10 items-center gap-3 rounded-md px-3 text-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
const ITEM_IDLE = "text-neutral-400 hover:bg-white/[0.06] hover:text-white"
const ITEM_ACTIVE = "bg-white font-medium text-neutral-950"

function isActivePath(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href)
}

// 押してから画面が切り替わるまでの間、アイコンをくるくるに変えて「反応している」ことを伝える
function NavIcon({ icon: Icon, className = "size-[18px]" }: { icon: LucideIcon; className?: string }) {
  const { pending } = useLinkStatus()
  return pending ? (
    <Loader2 className={`${className} shrink-0 animate-spin`} aria-hidden="true" />
  ) : (
    <Icon className={`${className} shrink-0`} aria-hidden="true" />
  )
}

function NavLink({
  href,
  icon,
  title,
  active,
  onNavigate,
}: {
  href: string
  icon: LucideIcon
  title: string
  active: boolean
  onNavigate?: () => void
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={`${ITEM} ${active ? ITEM_ACTIVE : ITEM_IDLE}`}
    >
      <NavIcon icon={icon} />
      <span className="truncate">{title}</span>
    </Link>
  )
}

function Brand() {
  return (
    <Link
      href="/admin"
      aria-label="Lumital ダッシュボード"
      className="inline-flex flex-col rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
    >
      <LumitalLogo className="h-6 w-auto self-start" />
      <span className="mt-2 text-[11px] tracking-[0.2em] text-neutral-500">案件管理システム</span>
    </Link>
  )
}

// withUtilities：設定・ログアウトなど。PCはヘッダーに出すので、スマホのメニューの中だけで表示する
function AdminNav({
  onNavigate,
  withUtilities = false,
}: {
  onNavigate?: () => void
  withUtilities?: boolean
}) {
  const pathname = usePathname()

  return (
    <>
      <nav aria-label="メインメニュー" className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.href}>
              <NavLink
                {...item}
                active={isActivePath(pathname, item.href)}
                onNavigate={onNavigate}
              />
            </li>
          ))}
        </ul>
      </nav>

      {withUtilities && (
        <div className="space-y-1 border-t border-white/10 px-3 py-3">
          <NavLink
            href="/admin/settings"
            icon={Settings}
            title="設定"
            active={isActivePath(pathname, "/admin/settings")}
            onNavigate={onNavigate}
          />
          <a
            href="https://dashboard.stripe.com/products"
            target="_blank"
            rel="noopener noreferrer"
            className={`${ITEM} ${ITEM_IDLE}`}
          >
            <CreditCard className="size-[18px] shrink-0" aria-hidden="true" />
            <span className="truncate">Stripe商品管理</span>
            <ArrowUpRight className="ml-auto size-4 shrink-0 text-neutral-500" aria-hidden="true" />
            <span className="sr-only">（新しいタブで開きます）</span>
          </a>
          <Link href="/" onClick={onNavigate} className={`${ITEM} ${ITEM_IDLE}`}>
            <Globe className="size-[18px] shrink-0" aria-hidden="true" />
            <span className="truncate">LP を表示</span>
          </Link>
          <a href="/auth/logout" className={`${ITEM} ${ITEM_IDLE}`}>
            <LogOut className="size-[18px] shrink-0" aria-hidden="true" />
            <span className="truncate">ログアウト</span>
          </a>
        </div>
      )}
    </>
  )
}

// PC：画面の高さいっぱいに固定した黒のサイドバー
export function AdminSidebar() {
  return (
    <aside className="hidden h-dvh w-64 shrink-0 flex-col bg-neutral-950 text-white lg:flex">
      <div className="px-6 pb-6 pt-7">
        <Brand />
      </div>
      <AdminNav />
    </aside>
  )
}

const HEADER_ITEM =
  "flex h-9 items-center gap-2 rounded-md px-3 text-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950/30"
const HEADER_IDLE = "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950"

// PC：中身の上に置く白いヘッダー。設定・ログアウトなど、毎日は使わないものをまとめる
export function AdminHeader() {
  const pathname = usePathname()
  const settingsActive = isActivePath(pathname, "/admin/settings")

  return (
    <header className="hidden h-14 shrink-0 items-center justify-end gap-1 border-b border-neutral-200 bg-white px-6 lg:flex">
      <Link href="/" className={`${HEADER_ITEM} ${HEADER_IDLE}`}>
        <Globe className="size-4 shrink-0" aria-hidden="true" />
        LP を表示
      </Link>
      <a
        href="https://dashboard.stripe.com/products"
        target="_blank"
        rel="noopener noreferrer"
        className={`${HEADER_ITEM} ${HEADER_IDLE}`}
      >
        <CreditCard className="size-4 shrink-0" aria-hidden="true" />
        Stripe商品管理
        <ArrowUpRight className="size-3.5 shrink-0 text-neutral-400" aria-hidden="true" />
        <span className="sr-only">（新しいタブで開きます）</span>
      </a>
      <Link
        href="/admin/settings"
        aria-current={settingsActive ? "page" : undefined}
        className={`${HEADER_ITEM} ${
          settingsActive ? "bg-neutral-100 font-medium text-neutral-950" : HEADER_IDLE
        }`}
      >
        <NavIcon icon={Settings} className="size-4" />
        設定
      </Link>
      <span className="mx-2 h-5 w-px bg-neutral-200" aria-hidden="true" />
      <a href="/auth/logout" className={`${HEADER_ITEM} ${HEADER_IDLE}`}>
        <LogOut className="size-4 shrink-0" aria-hidden="true" />
        ログアウト
      </a>
    </header>
  )
}

// スマホ・タブレット：上部のヘッダーと、左から開くメニュー
export function AdminMobileHeader() {
  const [open, setOpen] = useState(false)

  // メニューを開いたまま画面を広げたとき（タブレットの回転など）は閉じる
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)")
    const close = () => mq.matches && setOpen(false)
    mq.addEventListener("change", close)
    return () => mq.removeEventListener("change", close)
  }, [])

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <header className="flex shrink-0 items-center gap-2 bg-neutral-950 pl-2 pr-4 pt-[env(safe-area-inset-top)] text-white lg:hidden">
        <Dialog.Trigger className="flex h-14 items-center gap-2 rounded-md px-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/60">
          <Menu className="size-5" aria-hidden="true" />
          メニュー
        </Dialog.Trigger>
        <Link
          href="/admin"
          aria-label="Lumital ダッシュボード"
          className="ml-auto rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
        >
          <LumitalLogo className="h-5 w-auto" />
        </Link>
      </header>

      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/50 transition-opacity duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0 lg:hidden" />
        <Dialog.Popup className="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col bg-neutral-950 pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)] text-white shadow-2xl outline-none transition-transform duration-200 ease-out data-ending-style:-translate-x-full data-starting-style:-translate-x-full lg:hidden">
          <Dialog.Title className="sr-only">メニュー</Dialog.Title>
          <div className="flex items-start justify-between pb-5 pl-6 pr-2 pt-4">
            <div className="pt-3">
              <Brand />
            </div>
            <Dialog.Close
              aria-label="メニューを閉じる"
              className="flex size-11 items-center justify-center rounded-md text-neutral-400 transition-colors hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            >
              <X className="size-5" aria-hidden="true" />
            </Dialog.Close>
          </div>
          <AdminNav onNavigate={() => setOpen(false)} withUtilities />
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
