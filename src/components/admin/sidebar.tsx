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
import { BarChart3, Users, Briefcase, FileText, CalendarDays, ShoppingBag } from "lucide-react"

const navItems = [
  { title: "ダッシュボー��", href: "/admin", icon: BarChart3 },
  { title: "タレント管理", href: "/admin/talents", icon: Users },
  { title: "案件管理", href: "/admin/jobs", icon: Briefcase },
  { title: "応募管理", href: "/admin/applications", icon: FileText },
  { title: "スケジュール", href: "/admin/schedule", icon: CalendarDays },
  { title: "オプション管理", href: "/admin/options", icon: ShoppingBag },
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
    <Sidebar
      collapsible="icon"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <SidebarHeader className="border-b p-4 group-data-[collapsible=icon]:p-2">
        <Link href="/admin" className="font-bold text-xl group-data-[collapsible=icon]:hidden">
          VOZEL
        </Link>
        <Link href="/admin" className="hidden group-data-[collapsible=icon]:block font-bold text-sm text-center">
          V
        </Link>
        <p className="text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">案件管理システム</p>
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
                          <item.icon className="h-4 w-4 shrink-0" />
                          <span>{item.title}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
      <SidebarFooter className="border-t p-4 space-y-2 group-data-[collapsible=icon]:p-2">
        <Link href="/" className="text-sm text-muted-foreground hover:underline block group-data-[collapsible=icon]:hidden">
          LP を表示
        </Link>
        <a href="/auth/logout" className="text-sm text-muted-foreground hover:underline block group-data-[collapsible=icon]:hidden">
          ログアウト
        </a>
      </SidebarFooter>
    </Sidebar>
  )
}
