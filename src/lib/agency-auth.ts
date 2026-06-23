import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { getIronSession } from "iron-session"
import { sessionOptions, type SessionData } from "./session"
import { prisma } from "./db"

export async function getAgencySession() {
  const cookieStore = await cookies()
  return getIronSession<SessionData>(cookieStore, sessionOptions)
}

export async function requireAgencyAdmin() {
  const session = await getAgencySession()
  if (!session.agencyId || session.role !== "agency_admin") redirect("/agency/login")

  const agency = await prisma.agency.findUnique({
    where: { id: session.agencyId },
    select: {
      id: true,
      name: true,
      email: true,
      emailVerified: true,
      onboardingCompleted: true,
      subscriptionStatus: true,
      currentPeriodEnd: true,
    },
  })

  if (!agency || !agency.emailVerified) redirect("/agency/login")
  if (!agency.onboardingCompleted) redirect("/agency/onboarding")
  return agency
}

export async function requireAgencyForOnboarding() {
  const session = await getAgencySession()
  if (!session.agencyId || session.role !== "agency_admin") redirect("/agency/login")

  const agency = await prisma.agency.findUnique({
    where: { id: session.agencyId },
    select: { id: true, name: true, email: true, emailVerified: true, onboardingCompleted: true },
  })

  if (!agency || !agency.emailVerified) redirect("/agency/login")
  if (agency.onboardingCompleted) redirect("/agency/subscribe")
  return agency
}
