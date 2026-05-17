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
import { BarChart3, Users, Briefcase, FileText, CalendarDays, ShoppingBag, Building2, Receipt, Settings } from "lucide-react"

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

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar collapsible="none">
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
      <SidebarFooter className="border-t p-4 space-y-2">
        <Link href="/admin/settings" className="text-sm text-muted-foreground hover:underline flex items-center gap-2">
          <Settings className="h-4 w-4 shrink-0" />
          <span>設定</span>
        </Link>
        <Link href="/" className="text-sm text-muted-foreground hover:underline block">
          LP を表示
        </Link>
        <a href="/auth/logout" className="text-sm text-muted-foreground hover:underline block">
          ログアウト
        </a>
      </SidebarFooter>
    </Sidebar>
  )
}
