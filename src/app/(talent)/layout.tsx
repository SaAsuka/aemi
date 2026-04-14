import { OfflineBanner } from "@/components/offline-banner"

export const dynamic = "force-dynamic"

export default function TalentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <OfflineBanner />
      {children}
    </>
  )
}
