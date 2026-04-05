"use client"

import { useRef, useCallback } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar"

const navItems = [
  { title: "ダッシュボード", href: "/admin", icon: "📊" },
  { title: "タレント管理", href: "/admin/talents", icon: "👤" },
  { title: "案件管理", href: "/admin/jobs", icon: "📋" },
  { title: "応募管理", href: "/admin/applications", icon: "📝" },
  { title: "スケジュール", href: "/admin/schedule", icon: "📅" },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const { setOpen } = useSidebar()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleMouseEnter = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setOpen(true)
  }, [setOpen])

  const handleMouseLeave = useCallback(() => {
    timerRef.current = setTimeout(() => setOpen(false), 300)
  }, [setOpen])

  return (
    <>
      {/* ホバートリガー: サイドバーが閉じているとき左端に透明なエリアを表示 */}
      <div
        className="fixed inset-y-0 left-0 z-20 w-3 hidden md:block"
        onMouseEnter={handleMouseEnter}
      />
      <div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
        <Sidebar>
          <SidebarHeader className="border-b p-4">
            <Link href="/admin" className="font-bold text-xl">
              VOZEL
            </Link>
            <p className="text-xs text-muted-foreground">案件管理システム</p>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>メニュー</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navItems.map((item) => {
                    const isActive =
                      item.href === "/admin"
                        ? pathname === "/admin"
                        : pathname.startsWith(item.href)
                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          render={<Link href={item.href} />}
                          isActive={isActive}
                        >
                          <span>{item.icon}</span>
                          <span>{item.title}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="border-t p-4 space-y-2">
            <Link href="/" className="text-sm text-muted-foreground hover:underline block">
              LP を表示
            </Link>
            <a href="/auth/logout" className="text-sm text-muted-foreground hover:underline block">
              ログアウト
            </a>
          </SidebarFooter>
        </Sidebar>
      </div>
    </>
  )
}
