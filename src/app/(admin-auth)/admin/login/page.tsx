import type { Metadata } from "next"
import { LumitalLogo } from "@/components/brand/lumital-logo"
import { AdminLoginForm } from "./login-form"

export const metadata: Metadata = {
  title: "管理者ログイン | Lumital",
  robots: { index: false, follow: false },
}

// 光（Lumital）をイメージした、黒地にごく薄く差す明かり
const GLOW = {
  backgroundImage:
    "radial-gradient(ellipse 80% 60% at 85% 0%, rgba(255,255,255,0.09), transparent 70%)",
}

export default function AdminLoginPage() {
  const year = new Date().getFullYear()

  return (
    <div className="flex min-h-[100dvh] flex-col bg-white text-neutral-950 lg:grid lg:grid-cols-[minmax(0,11fr)_minmax(0,13fr)]">
      {/* ブランド面：PCは左半分、スマホは上部の帯 */}
      <div
        className="relative flex shrink-0 flex-col justify-end overflow-hidden bg-neutral-950 px-6 pb-14 pt-[calc(4rem+env(safe-area-inset-top))] text-white lg:justify-between lg:p-14 xl:p-16"
        style={GLOW}
      >
        <div className="mx-auto w-full max-w-[380px] animate-in fade-in duration-1000 motion-reduce:animate-none lg:mx-0 lg:my-auto lg:max-w-none">
          <LumitalLogo className="h-9 w-auto lg:h-14 xl:h-16" />
          <p className="mt-4 text-xs tracking-[0.2em] text-neutral-400 lg:mt-6 lg:text-sm">
            案件管理システム
          </p>
        </div>
        <p className="hidden text-xs text-neutral-500 lg:block">
          © {year} Lumital
        </p>
      </div>

      {/* フォーム面 */}
      <div className="relative -mt-5 flex flex-1 flex-col rounded-t-[20px] bg-white px-6 pt-10 lg:mt-0 lg:items-center lg:justify-center lg:rounded-none lg:px-16 lg:pt-0">
        <div className="w-full max-w-[380px] animate-in fade-in slide-in-from-bottom-2 duration-700 motion-reduce:animate-none max-lg:mx-auto">
          <h1 className="text-2xl font-semibold tracking-tight">管理者ログイン</h1>
          <p className="mt-2 text-sm leading-relaxed text-neutral-500">
            管理者用のパスワードを入力してください。
          </p>

          <div className="mt-8">
            <AdminLoginForm />
          </div>

          <p className="mt-8 border-t border-neutral-200 pt-6 text-xs leading-relaxed text-neutral-500">
            パスワードがわからない場合は、
            <span className="inline-block">システム管理者にお問い合わせください。</span>
          </p>
        </div>

        <p className="mt-auto pt-8 pb-[calc(2rem+env(safe-area-inset-bottom))] text-center text-xs text-neutral-400 lg:hidden">
          © {year} Lumital
        </p>
      </div>
    </div>
  )
}
