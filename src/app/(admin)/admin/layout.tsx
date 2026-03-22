export const dynamic = "force-dynamic"

import { AdminSidebar } from "@/components/admin/sidebar"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset>
        <main className="p-3 sm:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
