"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Briefcase, Send, MessageCircle, ChevronRight, ChevronLeft, PartyPopper } from "lucide-react"
import { BTN_LINE, BTN_PRIMARY, BTN_SECONDARY } from "@/components/talent/styles"

const slides = [
  {
    icon: Briefcase,
    title: "案件を探す",
    description: "あなたの条件にマッチする案件が一覧で表示されます。性別・年齢・身長で自動マッチングするので、応募できる案件がひと目で分かります。",
  },
  {
    icon: Send,
    title: "かんたん応募",
    description: "案件詳細から「応募する」ボタンをタップするだけ。必要な提出物はその場でアップロードできます。応募状況はマイページからいつでも確認できます。",
  },
  {
    icon: MessageCircle,
    title: "LINEで案件通知",
    description: "LINE連携すると、あなたにマッチする新着案件がLINEに届きます。通知からそのまま案件ページに飛べるので、チャンスを逃しません。",
  },
]

export function WelcomeTutorial({ talentName, hasLine }: { talentName: string; hasLine: boolean }) {
  const router = useRouter()
  const [current, setCurrent] = useState(0)

  const isLast = current === slides.length - 1
  const slide = slides[current]
  const Icon = slide.icon

  return (
    <div>
      <div className="flex size-12 items-center justify-center rounded-full bg-neutral-950">
        <PartyPopper className="size-6 text-white" aria-hidden="true" />
      </div>
      <h1 className="mt-6 text-2xl font-semibold tracking-tight">ようこそ、{talentName}さん！</h1>
      <p className="mt-2 text-sm leading-relaxed text-neutral-500">
        登録が完了しました。
        <span className="inline-block">VOZELの使い方をご紹介します。</span>
      </p>

      {/* スライドコンテンツ */}
      <div className="mt-8 rounded-xl border border-neutral-200 p-6" aria-live="polite">
        <div className="flex items-center justify-between">
          <div className="flex size-11 items-center justify-center rounded-full bg-neutral-100">
            <Icon className="size-5 text-neutral-950" aria-hidden="true" />
          </div>
          <span className="text-xs tabular-nums text-neutral-400">
            {current + 1} / {slides.length}
          </span>
        </div>
        <h2 className="mt-4 text-lg font-semibold">{slide.title}</h2>
        <p className="mt-2 min-h-[6.5rem] text-sm leading-relaxed text-neutral-600">{slide.description}</p>
      </div>

      {/* ドットインジケーター */}
      <div className="mt-5 flex justify-center gap-1">
        {slides.map((s, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setCurrent(idx)}
            aria-label={`${idx + 1}枚目：${s.title}`}
            aria-current={idx === current ? "step" : undefined}
            className="flex h-6 items-center px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950/30 rounded-full"
          >
            <span className={`block h-1.5 rounded-full transition-all duration-300 ${idx === current ? "w-6 bg-neutral-950" : "w-1.5 bg-neutral-300"}`} />
          </button>
        ))}
      </div>

      {/* ナビゲーション */}
      {isLast && !hasLine && (
        <p className="mt-6 text-sm text-neutral-500">マイページに進むにはLINE連携が必要です</p>
      )}
      <div className={`${isLast && !hasLine ? "mt-3" : "mt-6"} flex gap-3`}>
        {current > 0 && (
          <button type="button" className={`${BTN_SECONDARY} ${isLast ? "w-12 px-0" : "flex-1"}`} onClick={() => setCurrent((c) => c - 1)} aria-label="戻る">
            <ChevronLeft aria-hidden="true" />
            {!isLast && "戻る"}
          </button>
        )}
        {!isLast ? (
          <button type="button" className={`${BTN_PRIMARY} flex-[2]`} onClick={() => setCurrent((c) => c + 1)}>
            次へ
            <ChevronRight aria-hidden="true" />
          </button>
        ) : !hasLine ? (
          <button
            type="button"
            className={`${BTN_LINE} flex-1`}
            onClick={() => { window.location.href = "/api/line/auth?returnTo=/welcome" }}
          >
            <MessageCircle aria-hidden="true" />
            LINEで連携する
          </button>
        ) : (
          <button type="button" className={`${BTN_PRIMARY} flex-1`} onClick={() => router.push("/mypage")}>
            マイページへ
            <ChevronRight aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  )
}
