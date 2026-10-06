"use client"

import { useSyncExternalStore } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { LumitalLogo } from "@/components/brand/lumital-logo"

// 光（Lumital）をイメージした、黒地にごく薄く差す明かり（管理者ログイン画面と揃える）
const GLOW = {
  backgroundImage:
    "radial-gradient(ellipse 70% 50% at 85% 0%, rgba(255,255,255,0.09), transparent 70%)",
}

// 「前のページに戻る」は、このサイト内から来たときだけ出す
// （URLを直接開いた・LINEから開いた場合に押すと、サイトの外へ出てしまうため）
function cameFromThisSite() {
  try {
    if (window.history.length <= 1) return false
    // 画面内の移動（Next.jsのリンク）で来た：最初に読み込んだURLと今のURLが違う
    const [entry] = performance.getEntriesByType("navigation")
    if (entry && entry.name !== window.location.href) return true
    // ページの読み込みで来た：直前のページが同じサイト
    const ref = document.referrer
    return !!ref && new URL(ref).origin === window.location.origin
  } catch {
    return false
  }
}

const noopSubscribe = () => () => {}

export function NotFoundView() {
  const pathname = usePathname() ?? ""
  const router = useRouter()
  const canGoBack = useSyncExternalStore(noopSubscribe, cameFromThisSite, () => false)

  // 管理画面（Lumital）とタレント側（VOZEL）で、ロゴと戻り先を出し分ける
  const isAdmin = pathname.startsWith("/admin")
  const home = isAdmin
    ? { href: "/admin", label: "ダッシュボードへ戻る" }
    : { href: "/mypage", label: "マイページへ戻る" }

  return (
    <div
      className="flex min-h-[100dvh] flex-col bg-neutral-950 text-white"
      style={GLOW}
    >
      <header className="px-6 pt-[calc(1.75rem+env(safe-area-inset-top))] lg:px-16 lg:pt-12">
        {isAdmin ? (
          <LumitalLogo className="h-6 w-auto lg:h-7" />
        ) : (
          <p className="text-lg font-bold tracking-[0.2em]">VOZEL</p>
        )}
      </header>

      <main className="flex flex-1 items-center px-6 py-16 lg:px-16">
        <div className="mx-auto w-full max-w-[440px] animate-in fade-in slide-in-from-bottom-2 duration-700 motion-reduce:animate-none">
          <p
            aria-hidden="true"
            className="text-[88px] font-semibold leading-none tracking-tighter tabular-nums lg:text-[128px]"
          >
            404
          </p>
          <p className="mt-4 text-xs tracking-[0.2em] text-neutral-500">PAGE NOT FOUND</p>

          <h1 className="mt-8 text-2xl font-semibold tracking-tight">
            ページが見つかりません
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-neutral-400">
            <span className="inline-block">ページが移動または削除された可能性があります。</span>
            <span className="inline-block">URLに誤りがないかもご確認ください。</span>
          </p>

          {pathname && (
            <p className="mt-6 rounded-lg border border-neutral-800 bg-white/[0.03] px-4 py-3 font-mono text-xs leading-relaxed break-all text-neutral-400">
              {pathname}
            </p>
          )}

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link
              href={home.href}
              className="flex h-12 items-center justify-center rounded-lg bg-white px-6 text-base font-medium text-neutral-950 transition-[background-color,transform] duration-150 hover:bg-neutral-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/30 active:scale-[0.99] sm:flex-1"
            >
              {home.label}
            </Link>
            {canGoBack && (
              <button
                type="button"
                onClick={() => router.back()}
                className="flex h-12 items-center justify-center gap-2 rounded-lg border border-neutral-700 px-6 text-base font-medium text-white transition-[background-color,border-color,transform] duration-150 hover:border-neutral-500 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/30 active:scale-[0.99] sm:flex-1"
              >
                <ArrowLeft className="size-4" aria-hidden="true" />
                前のページに戻る
              </button>
            )}
          </div>
        </div>
      </main>

      <footer className="px-6 pb-[calc(1.75rem+env(safe-area-inset-bottom))] text-xs text-neutral-600 lg:px-16 lg:pb-12">
        © {new Date().getFullYear()} {isAdmin ? "Lumital" : "VOZEL"}
      </footer>
    </div>
  )
}
