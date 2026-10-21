import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { requireTalentRaw } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { TalentSetupForm } from "@/components/talent-setup-form"

export const metadata: Metadata = {
  title: "プロフィール登録 | VOZEL",
}

export default async function SetupPage() {
  const talent = await requireTalentRaw()

  if (talent.nameKana !== "未設定") {
    redirect("/mypage")
  }

  const photos = await prisma.talentPhoto.findMany({
    where: { talentId: talent.id },
    orderBy: { sortOrder: "asc" },
  })

  return (
    <div className="min-h-[100dvh] bg-white text-neutral-950">
      <header className="border-b border-neutral-200 pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex h-14 max-w-2xl items-center px-4">
          <p className="text-base font-bold tracking-[0.2em]">VOZEL</p>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 pb-[calc(3rem+env(safe-area-inset-bottom))] pt-8 sm:pt-10">
        <h1 className="text-2xl font-semibold tracking-tight">ようこそ</h1>
        <p className="mt-2 text-sm leading-relaxed text-neutral-500">
          プロフィールを登録して、
          <span className="inline-block">案件への応募を始めましょう。</span>
        </p>
        <div className="mt-8">
          <TalentSetupForm email={talent.email ?? ""} talentId={talent.id} photos={photos} />
        </div>
      </main>
    </div>
  )
}
