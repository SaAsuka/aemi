import type { Metadata } from "next"
import { TalentRegisterForm } from "@/components/talent-register-form"

export const metadata: Metadata = {
  title: "タレント登録 | VOZEL",
}

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string }>
}) {
  const { t } = await searchParams

  return (
    <div className="min-h-[100dvh] bg-white text-neutral-950">
      <header className="border-b border-neutral-200 pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex h-14 max-w-2xl items-center px-4">
          <p className="text-base font-bold tracking-[0.2em]">VOZEL</p>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 pb-[calc(3rem+env(safe-area-inset-bottom))] pt-8 sm:pt-10">
        <h1 className="text-2xl font-semibold tracking-tight">タレント登録フォーム</h1>
        <p className="mt-2 text-sm leading-relaxed text-neutral-500">
          以下の情報をご入力ください。
          <span className="inline-block">「必須」の項目は必ず入力してください。</span>
        </p>
        <div className="mt-8">
          <TalentRegisterForm priceToken={t} />
        </div>
      </main>
    </div>
  )
}
