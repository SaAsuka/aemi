export const dynamic = "force-dynamic"

import { cookies } from "next/headers"
import { getIronSession } from "iron-session"
import { sessionOptions, type SessionData } from "@/lib/session"
import { prisma } from "@/lib/db"
import { AgencySidebar } from "@/components/agency/agency-sidebar"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"

export default async function AgencyRootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions)

  if (!session.agencyId || session.role !== "agency_admin") {
    return <>{children}</>
  }

  const agency = await prisma.agency.findUnique({
    where: { id: session.agencyId },
    select: { name: true, emailVerified: true, onboardingCompleted: true },
  })

  if (!agency?.emailVerified || !agency?.onboardingCompleted) {
    return <>{children}</>
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <AgencySidebar agencyName={agency.name} />
      <SidebarInset>
        <div className="h-dvh overflow-auto p-3 sm:p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
