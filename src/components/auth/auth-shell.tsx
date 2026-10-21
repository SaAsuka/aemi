// タレント側の認証画面（ログイン・パスワード設定など）の外枠
// 管理者ログイン画面と同じ作りで、ロゴの代わりに VOZEL の文字を置く

// 管理者ログイン画面と揃えた、黒地にごく薄く差す明かり
const GLOW = {
  backgroundImage:
    "radial-gradient(ellipse 80% 60% at 85% 0%, rgba(255,255,255,0.09), transparent 70%)",
}

export function AuthShell({ children }: { children: React.ReactNode }) {
  const year = new Date().getFullYear()

  return (
    <div className="flex min-h-[100dvh] flex-col bg-white text-neutral-950 lg:grid lg:grid-cols-[minmax(0,11fr)_minmax(0,13fr)]">
      {/* ブランド面：PCは左半分、スマホは上部の帯 */}
      <div
        className="relative flex shrink-0 flex-col justify-end overflow-hidden bg-neutral-950 px-6 pb-14 pt-[calc(4rem+env(safe-area-inset-top))] text-white lg:justify-between lg:p-14 xl:p-16"
        style={GLOW}
      >
        <div className="mx-auto w-full max-w-[380px] animate-in fade-in duration-1000 motion-reduce:animate-none lg:mx-0 lg:my-auto lg:max-w-none">
          <p className="text-3xl font-bold leading-none tracking-[0.2em] lg:text-6xl xl:text-7xl">
            VOZEL
          </p>
          <p className="mt-4 text-xs tracking-[0.2em] text-neutral-400 lg:mt-6 lg:text-sm">
            案件マッチングプラットフォーム
          </p>
        </div>
        <p className="hidden text-xs text-neutral-500 lg:block">
          © {year} VOZEL
        </p>
      </div>

      {/* フォーム面 */}
      <div className="relative -mt-5 flex flex-1 flex-col rounded-t-[20px] bg-white px-6 pt-10 lg:mt-0 lg:items-center lg:justify-center lg:rounded-none lg:px-16 lg:pt-0">
        <div className="w-full max-w-[380px] animate-in fade-in slide-in-from-bottom-2 duration-700 motion-reduce:animate-none max-lg:mx-auto">
          {children}
        </div>

        <p className="mt-auto pt-8 pb-[calc(2rem+env(safe-area-inset-bottom))] text-center text-xs text-neutral-400 lg:hidden">
          © {year} VOZEL
        </p>
      </div>
    </div>
  )
}
