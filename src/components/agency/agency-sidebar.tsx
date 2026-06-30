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
import { BarChart3, Users, Briefcase, FileText, CalendarDays, ShoppingBag, Receipt, Building2 } from "lucide-react"

const navItems = [
  { title: "ダッシュボード", href: "/agency/dashboard", icon: BarChart3 },
  { title: "タレント管理", href: "/agency/talents", icon: Users },
  { title: "案件管理", href: "/agency/jobs", icon: Briefcase },
  { title: "応募管理", href: "/agency/applications", icon: FileText },
  { title: "スケジュール", href: "/agency/schedule", icon: CalendarDays },
  { title: "オプション管理", href: "/agency/options", icon: ShoppingBag },
  { title: "クライアント", href: "/agency/clients", icon: Building2 },
  { title: "請求書", href: "/agency/invoices", icon: Receipt },
]

export function AgencySidebar({ agencyName }: { agencyName: string }) {
  const pathname = usePathname()

  return (
    <Sidebar collapsible="none">
      <SidebarHeader className="border-b p-4">
        <div className="font-bold text-xl">{agencyName}</div>
        <p className="text-xs text-muted-foreground">代理店管理画面</p>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>メニュー</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive =
                  item.href === "/agency/dashboard"
                    ? pathname === "/agency/dashboard"
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
        <a href="/agency/logout" className="text-sm text-muted-foreground hover:underline block">
          ログアウト
        </a>
      </SidebarFooter>
    </Sidebar>
  )
}
