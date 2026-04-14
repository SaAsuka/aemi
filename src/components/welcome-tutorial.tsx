"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Briefcase, Send, MessageCircle, ChevronRight, ChevronLeft, PartyPopper } from "lucide-react"

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
    <div className="space-y-8 text-center">
      <div className="space-y-2">
        <PartyPopper className="h-8 w-8 text-primary mx-auto" />
        <h1 className="text-xl font-bold">ようこそ、{talentName}さん！</h1>
        <p className="text-sm text-muted-foreground">登録が完了しました。VOZELの使い方をご紹介します。</p>
      </div>

      {/* ドットインジケーター */}
      <div className="flex justify-center gap-2">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrent(idx)}
            className={`h-2 rounded-full transition-all ${idx === current ? "w-6 bg-primary" : "w-2 bg-muted-foreground/30"}`}
          />
        ))}
      </div>

      {/* スライドコンテンツ */}
      <div className="rounded-xl border bg-card p-6 space-y-4 min-h-[200px] flex flex-col items-center justify-center">
        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <h2 className="text-lg font-semibold">{slide.title}</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">{slide.description}</p>
      </div>

      {/* ナビゲーション */}
      <div className="flex gap-3">
        {current > 0 && (
          <Button variant="outline" size="lg" className="flex-1" onClick={() => setCurrent((c) => c - 1)}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            戻る
          </Button>
        )}
        {!isLast ? (
          <Button size="lg" className="flex-1" onClick={() => setCurrent((c) => c + 1)}>
            次へ
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <div className="flex-1 space-y-3">
            {!hasLine && (
              <Button size="lg" className="w-full bg-[#06C755] hover:bg-[#05b34d]" onClick={() => { window.location.href = "/api/line/auth" }}>
                <MessageCircle className="h-4 w-4 mr-2" />
                LINEで連携する
              </Button>
            )}
            <Button
              variant={hasLine ? "default" : "outline"}
              size="lg"
              className="w-full"
              onClick={() => router.push("/mypage")}
            >
              マイページへ
            </Button>
          </div>
        )}
      </div>

      {!isLast && (
        <button
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => router.push("/mypage")}
        >
          スキップしてマイページへ →
        </button>
      )}
    </div>
  )
}
