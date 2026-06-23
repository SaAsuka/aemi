import Link from "next/link"
import { requireAgencyAdmin } from "@/lib/agency-auth"
import { CreditCard, CheckCircle2 } from "lucide-react"

export default async function AgencySubscribePage() {
  const agency = await requireAgencyAdmin()

  const priceId = process.env.AGENCY_STRIPE_PRICE_ID

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-6 rounded-xl border bg-white p-8 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">ステップ 2 / 3</span>
          </div>
          <h1 className="text-xl font-bold">お支払いプランの選択</h1>
          <p className="text-sm text-muted-foreground mt-1">{agency.name} 様</p>
        </div>

        {priceId ? (
          <div className="space-y-4">
            <div className="rounded-lg border-2 border-primary p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold">スタンダードプラン</span>
                <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">おすすめ</span>
              </div>
              <p className="text-2xl font-bold">¥500 <span className="text-sm font-normal text-muted-foreground">/ タレント / 月</span></p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-green-600" />タレント管理</li>
                <li className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-green-600" />案件マッチング</li>
                <li className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-green-600" />LINE連携</li>
              </ul>
            </div>
            <form action="/api/agency/create-checkout" method="POST">
              <input type="hidden" name="agencyId" value={agency.id} />
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 rounded-md bg-primary px-3 py-2.5 text-sm font-medium text-primary-foreground"
              >
                <CreditCard className="h-4 w-4" />
                お支払い情報を入力する
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <p className="font-medium">料金プラン準備中</p>
              <p className="mt-1 text-amber-700">現在料金プランを調整中です。準備が整い次第ご連絡いたします。</p>
            </div>
            <div className="rounded-lg bg-muted/40 p-4 text-sm text-muted-foreground space-y-1">
              <p>ご登録完了後、担当者よりご連絡いたします。</p>
              <p>今すぐダッシュボードをご確認いただけます。</p>
            </div>
            <Link
              href="/agency/dashboard"
              className="block w-full text-center rounded-md bg-primary px-3 py-2.5 text-sm font-medium text-primary-foreground"
            >
              ダッシュボードへ進む
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
