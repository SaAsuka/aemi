export const dynamic = "force-dynamic"

import { AdminSidebar } from "@/components/admin/sidebar"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset>
        <header className="flex items-center h-10 px-3 sm:px-6 pt-3 sm:pt-4 group-data-[state=expanded]/sidebar-wrapper:hidden">
          <SidebarTrigger />
        </header>
        <main className="p-3 sm:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
