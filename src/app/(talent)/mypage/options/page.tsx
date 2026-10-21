import type { Metadata } from "next"
import Link from "next/link"
import { requireTalent } from "@/lib/auth"
import { getActiveOptionsForTalent } from "@/lib/actions/option-purchase"
import { TalentNav } from "@/components/talent-nav"
import { AlertCircle, AlertTriangle, BookOpen, CheckCircle2, ChevronRight } from "lucide-react"
import { StatusChip } from "@/components/admin/status-chip"

export const metadata: Metadata = {
  title: "レッスン一覧 | VOZEL",
}

export default async function OptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ purchased?: string; error?: string }>
}) {
  const talent = await requireTalent()
  const { purchased, error } = await searchParams
  const options = await getActiveOptionsForTalent(talent.id)

  return (
    <div className="min-h-[100dvh] bg-white">
      <TalentNav talentName={talent.stageName || talent.name} />
      <main className="mx-auto max-w-7xl space-y-6 px-4 pb-[calc(3rem+env(safe-area-inset-bottom))] pt-8 text-neutral-950 sm:pt-10">
        <h1 className="text-2xl font-semibold tracking-tight">レッスン一覧</h1>

        {purchased && (
          <div role="status" className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-green-800">
            <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
            <p className="text-sm font-medium">購入が完了しました</p>
          </div>
        )}
        {error === "paid" && (
          <div className="flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
            このオプションはすでに購入済みです
          </div>
        )}
        {error === "unavailable" && (
          <div role="alert" className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
            このオプションは現在購入できません
          </div>
        )}

        {options.length === 0 ? (
          <div className="flex flex-col items-center rounded-xl border border-dashed border-neutral-300 px-4 py-14 text-center">
            <div className="flex size-11 items-center justify-center rounded-full bg-neutral-100">
              <BookOpen className="size-5 text-neutral-500" aria-hidden="true" />
            </div>
            <p className="mt-3 text-sm text-neutral-500">現在公開中のレッスンはありません</p>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
            {options.map((opt) => (
              <li key={opt.id}>
                <Link
                  href={`/mypage/options/${opt.id}`}
                  className="group flex h-full flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white transition-[border-color,background-color,transform] duration-150 hover:border-neutral-300 hover:bg-neutral-50/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950/30 active:scale-[0.99]"
                >
                  {opt.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={opt.imageUrl!} alt="" className="aspect-video w-full bg-neutral-100 object-cover" />
                  )}
                  <div className="flex flex-1 flex-col p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="text-[15px] font-semibold leading-snug text-neutral-950">{opt.name}</h2>
                      <ChevronRight className="mt-0.5 size-4 shrink-0 text-neutral-400 transition-colors group-hover:text-neutral-950" aria-hidden="true" />
                    </div>
                    {opt.description && (
                      <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-neutral-500">{opt.description}</p>
                    )}
                    <div className="mt-auto flex items-center justify-between gap-2 pt-4">
                      <p className="text-lg font-semibold tabular-nums">¥{opt.price.toLocaleString()}</p>
                      {opt.purchaseStatus === "PAID" ? (
                        <StatusChip tone="green" label="購入済み" />
                      ) : opt.purchaseStatus === "PENDING" ? (
                        <StatusChip tone="yellow" label="決済処理中" />
                      ) : opt.closed ? (
                        <StatusChip tone="gray" label="受付終了" />
                      ) : null}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  )
}
