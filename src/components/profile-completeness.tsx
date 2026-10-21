import Link from "next/link"
import { ArrowRight, CheckCircle2 } from "lucide-react"

type Props = {
  percentage: number
  incomplete: { label: string; section: string }[]
}

export function ProfileCompleteness({ percentage, incomplete }: Props) {
  if (percentage === 100) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-neutral-200 p-5">
        <CheckCircle2 className="size-5 shrink-0 text-green-700" aria-hidden="true" />
        <p className="text-sm font-medium text-neutral-950">プロフィール完成度 100% — すべての情報が登録されています</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-neutral-200 p-5">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-medium text-neutral-950">プロフィール完成度</p>
        <span className="text-2xl font-semibold tracking-tight tabular-nums">
          {percentage}
          <span className="ml-0.5 text-sm font-normal text-neutral-500">%</span>
        </span>
      </div>

      <div
        className="mt-3 h-1.5 overflow-hidden rounded-full bg-neutral-100"
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="プロフィール完成度"
      >
        <div className="h-full rounded-full bg-neutral-950 transition-all" style={{ width: `${percentage}%` }} />
      </div>

      {incomplete.length > 0 && (
        <div className="mt-4">
          <p className="text-xs text-neutral-500">未入力の項目</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {incomplete.slice(0, 6).map((item) => (
              <span key={item.label} className="inline-flex h-7 items-center rounded-full border border-neutral-200 bg-neutral-50 px-2.5 text-xs text-neutral-700">
                {item.label}
              </span>
            ))}
            {incomplete.length > 6 && (
              <span className="inline-flex h-7 items-center px-1 text-xs text-neutral-500">
                他{incomplete.length - 6}件
              </span>
            )}
          </div>
          <Link
            href="/mypage/settings"
            className="mt-4 inline-flex items-center gap-1 rounded-sm text-sm font-medium text-neutral-950 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950/30"
          >
            プロフィールを編集する
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      )}
    </div>
  )
}
