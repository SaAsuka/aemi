import { redirect } from "next/navigation"
import { requireTalentRaw } from "@/lib/auth"
import { TalentSetupForm } from "@/components/talent-setup-form"

export default async function SetupPage() {
  const talent = await requireTalentRaw()

  if (talent.nameKana !== "未設定") {
    redirect("/mypage")
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-6">
      <div>
        <h1 className="text-xl font-bold">プロフィール登録</h1>
        <p className="text-sm text-muted-foreground mt-1">
          案件に応募するために、まずプロフィール情報を入力してください。
        </p>
      </div>
      <TalentSetupForm email={talent.email ?? ""} />
    </div>
  )
}
