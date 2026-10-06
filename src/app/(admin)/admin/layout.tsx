export const dynamic = "force-dynamic"

import { AdminMobileHeader, AdminSidebar } from "@/components/admin/sidebar"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-dvh w-full">
      <a
        href="#admin-main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:text-neutral-950 focus:shadow-lg"
      >
        メインコンテンツへ移動
      </a>
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col bg-background">
        <AdminMobileHeader />
        <main id="admin-main" tabIndex={-1} className="min-h-0 flex-1 overflow-auto p-3 outline-none sm:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
