import Link from "next/link"
import { MessageCircle } from "lucide-react"

export function LineConnectAlert() {
  return (
    <div className="rounded-lg border border-[#06C755]/30 bg-[#06C755]/5 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#06C755]">
          <MessageCircle className="h-4.5 w-4.5 text-white" />
        </div>
        <div className="min-w-0">
          <p className="font-medium text-sm">LINE連携で案件通知を受け取ろう</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            あなたに合った案件が登録されたとき、LINEですぐにお知らせします
          </p>
          <Link
            href="/mypage/settings"
            className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-[#06C755] hover:underline"
          >
            設定画面で連携する →
          </Link>
        </div>
      </div>
    </div>
  )
}
