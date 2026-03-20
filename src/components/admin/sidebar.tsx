"use client"

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
} from "@/components/ui/sidebar"

const navItems = [
  { title: "ダッシュボード", href: "/admin", icon: "📊" },
  { title: "タレント管理", href: "/admin/talents", icon: "👤" },
  { title: "クライアント管理", href: "/admin/clients", icon: "🏢" },
  { title: "案件管理", href: "/admin/jobs", icon: "📋" },
  { title: "応募管理", href: "/admin/applications", icon: "📝" },
  { title: "スケジュール", href: "/admin/schedule", icon: "📅" },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar>
      <SidebarHeader className="border-b p-4">
        <Link href="/admin" className="font-bold text-xl">
          aemi
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
      <SidebarFooter className="border-t p-4">
        <Link href="/" className="text-sm text-muted-foreground hover:underline">
          LP を表示
        </Link>
      </SidebarFooter>
    </Sidebar>
  )
}
