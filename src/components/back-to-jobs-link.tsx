"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { readJobListReturn } from "@/lib/job-list-return"

// 案件ページの「案件一覧に戻る」。一覧から来たときは、そのときの絞り込み・並び順の一覧へ戻す
// （スクロール位置は一覧の側で戻す）。LINE のリンクなどから直接来たときは今までどおりの一覧へ
export function BackToJobsLink({ fallbackHref }: { fallbackHref: string }) {
  const router = useRouter()

  return (
    <Link
      href={fallbackHref}
      onClick={(e) => {
        const saved = readJobListReturn()
        if (!saved) return
        e.preventDefault()
        router.push(saved.url)
      }}
      className="text-sm text-muted-foreground hover:underline"
    >
      &larr; 案件一覧に戻る
    </Link>
  )
}
