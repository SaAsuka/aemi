import Link from "next/link"
import { CheckCircle2, Circle } from "lucide-react"

type Props = {
  percentage: number
  incomplete: { label: string; section: string }[]
}

export function ProfileCompleteness({ percentage, incomplete }: Props) {
  if (percentage === 100) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-4 flex items-center gap-3">
        <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
        <p className="text-sm text-green-800 font-medium">プロフィール完成度 100% — すべての情報が登録されています</p>
      </div>
    )
  }

  const color =
    percentage >= 80 ? "bg-green-500" :
    percentage >= 50 ? "bg-yellow-500" :
    "bg-red-500"

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">プロフィール完成度</p>
        <span className="text-sm font-bold">{percentage}%</span>
      </div>

      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${percentage}%` }} />
      </div>

      {incomplete.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground">未入力の項目:</p>
          <div className="flex flex-wrap gap-1.5">
            {incomplete.slice(0, 6).map((item) => (
              <span key={item.label} className="inline-flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded-md">
                <Circle className="h-3 w-3 text-muted-foreground" />
                {item.label}
              </span>
            ))}
            {incomplete.length > 6 && (
              <span className="text-xs text-muted-foreground px-2 py-1">
                他{incomplete.length - 6}件
              </span>
            )}
          </div>
          <Link href="/mypage/settings" className="text-xs text-primary hover:underline inline-block mt-1">
            プロフィールを編集する →
          </Link>
        </div>
      )}
    </div>
  )
}
