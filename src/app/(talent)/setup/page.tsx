import { redirect } from "next/navigation"
import { requireTalentRaw } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { TalentSetupForm } from "@/components/talent-setup-form"

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
    <div className="mx-auto max-w-2xl px-4 py-10 space-y-2">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">ようこそ</h1>
        <p className="text-sm text-muted-foreground">
          プロフィールを登録して、案件への応募を始めましょう。
        </p>
      </div>
      <TalentSetupForm email={talent.email ?? ""} talentId={talent.id} photos={photos} />
    </div>
  )
}
