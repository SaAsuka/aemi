import Link from "next/link"
import { MessageCircle } from "lucide-react"
import { BTN_LINE } from "@/components/talent/styles"

export function LineConnectAlert() {
  return (
    <div className="rounded-xl border border-[#06C755]/30 bg-[#06C755]/5 p-5">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#06C755]">
          <MessageCircle className="size-5 text-white" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="text-[15px] font-semibold text-neutral-950">LINE連携で案件通知を受け取ろう</p>
          <p className="mt-1 text-sm leading-relaxed text-neutral-600">
            あなたに合った案件が登録されたとき、LINEですぐにお知らせします
          </p>
        </div>
      </div>
      <Link href="/mypage/settings" className={`${BTN_LINE} mt-4 h-11 w-full text-[15px] sm:w-auto`}>
        設定画面で連携する
      </Link>
    </div>
  )
}
