import { requireTalent } from "@/lib/auth"
import { getActiveOptionsForTalent, createOptionCheckout } from "@/lib/actions/option-purchase"
import { TalentNav } from "@/components/talent-nav"
import { ShoppingBag, CheckCircle2, Clock } from "lucide-react"

export default async function OptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ purchased?: string }>
}) {
  const talent = await requireTalent()
  const { purchased } = await searchParams
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

        {options.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <ShoppingBag className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">現在公開中のレッスンはありません</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {options.map((opt) => (
              <div key={opt.id} className="rounded-lg border bg-card overflow-hidden">
                {opt.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={opt.imageUrl} alt={opt.name} className="w-full aspect-video object-cover" />
                )}
                <div className="p-4 space-y-3">
                  <div>
                    <h2 className="font-semibold text-sm">{opt.name}</h2>
                    {opt.description && (
                      <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">{opt.description}</p>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-bold">¥{opt.price.toLocaleString()}</p>
                    {opt.deadline && (
                      <p className="text-xs text-muted-foreground">
                        締切: {new Date(opt.deadline).toLocaleDateString("ja-JP")}
                      </p>
                    )}
                  </div>

                  {opt.purchaseStatus === "PAID" ? (
                    <div className="flex items-center gap-1.5 text-green-700 text-sm font-medium">
                      <CheckCircle2 className="h-4 w-4" />
                      購入済み
                    </div>
                  ) : opt.purchaseStatus === "PENDING" ? (
                    <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                      <Clock className="h-4 w-4" />
                      決済処理中
                    </div>
                  ) : (
                    <form action={createOptionCheckout.bind(null, opt.id)}>
                      <button
                        type="submit"
                        className="w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                      >
                        購入する
                      </button>
                    </form>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
