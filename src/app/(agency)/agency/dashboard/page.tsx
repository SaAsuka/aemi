import { requireAgencyAdmin } from "@/lib/agency-auth"
import { agencyLogout } from "@/lib/actions/agency-auth"
import { redirect } from "next/navigation"
import { Building2, Users, Briefcase, LogOut } from "lucide-react"

export default async function AgencyDashboardPage() {
  const agency = await requireAgencyAdmin()

  async function handleLogout() {
    "use server"
    await agencyLogout()
    redirect("/agency/login")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">{agency.name}</h1>
          <p className="text-xs text-muted-foreground">{agency.email}</p>
        </div>
        <form action={handleLogout}>
          <button type="submit" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <LogOut className="h-4 w-4" />
            ログアウト
          </button>
        </form>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8 space-y-6">
        <div>
          <h2 className="text-xl font-bold">ダッシュボード</h2>
          <p className="text-sm text-muted-foreground mt-1">代理店管理画面は現在準備中です</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border bg-white p-6 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">タレント</p>
              <p className="text-2xl font-bold">0</p>
            </div>
          </div>
          <div className="rounded-xl border bg-white p-6 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-50">
              <Briefcase className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">応募中案件</p>
              <p className="text-2xl font-bold">0</p>
            </div>
          </div>
          <div className="rounded-xl border bg-white p-6 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-50">
              <Building2 className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">プラン</p>
              <p className="text-sm font-semibold mt-0.5">
                {agency.subscriptionStatus === "ACTIVE" ? "契約中" : "準備中"}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-6">
          <p className="text-sm text-muted-foreground text-center py-8">
            タレント管理・案件管理機能は順次公開予定です
          </p>
        </div>
      </main>
    </div>
  )
}
