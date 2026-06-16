import Link from "next/link"
import { requireTalent } from "@/lib/auth"
import { getActiveOptionsForTalent } from "@/lib/actions/option-purchase"
import { TalentNav } from "@/components/talent-nav"
import { blobProxyUrl } from "@/lib/utils/blob"
import { ShoppingBag, CheckCircle2, Clock, ChevronRight } from "lucide-react"

export default async function OptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ purchased?: string; error?: string }>
}) {
  const talent = await requireTalent()
  const { purchased, error } = await searchParams
  const options = await getActiveOptionsForTalent(talent.id)

  return (
    <>
      <TalentNav talentName={talent.stageName || talent.name} />
      <div className="mx-auto max-w-7xl px-4 py-8 space-y-6">
        <h1 className="text-xl font-bold">レッスン一覧</h1>

        {purchased && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 flex items-center gap-2 text-green-800">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <p className="text-sm font-medium">購入が完了しました</p>
          </div>
        )}
        {error === "paid" && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            このオプションはすでに購入済みです
          </div>
        )}
        {error === "unavailable" && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            このオプションは現在購入できません
          </div>
        )}

        {options.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <ShoppingBag className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">現在公開中のレッスンはありません</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {options.map((opt) => (
              <Link
                key={opt.id}
                href={`/mypage/options/${opt.id}`}
                className="block rounded-lg border bg-card overflow-hidden hover:border-primary transition-colors"
              >
                {opt.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={blobProxyUrl(opt.imageUrl)} alt={opt.name} className="w-full aspect-video object-cover" />
                )}
                <div className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="font-semibold text-sm">{opt.name}</h2>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  </div>
                  {opt.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{opt.description}</p>
                  )}
                  <div className="flex items-center justify-between pt-1">
                    <p className="text-base font-bold">¥{opt.price.toLocaleString()}</p>
                    {opt.purchaseStatus === "PAID" ? (
                      <div className="flex items-center gap-1 text-green-700 text-xs font-medium">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        購入済み
                      </div>
                    ) : opt.purchaseStatus === "PENDING" ? (
                      <div className="flex items-center gap-1 text-muted-foreground text-xs">
                        <Clock className="h-3.5 w-3.5" />
                        決済処理中
                      </div>
                    ) : null}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
