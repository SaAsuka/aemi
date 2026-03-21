export const dynamic = "force-dynamic"

import Link from "next/link"
import { AdminSidebar } from "@/components/admin/sidebar"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset>
        <header className="flex h-14 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-6" />
          <Link href="/admin" className="font-semibold text-lg">
            aemi 管理
          </Link>
        </header>
        <main className="p-3 sm:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
