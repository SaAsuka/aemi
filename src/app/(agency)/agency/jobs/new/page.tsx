import Link from "next/link"
import { requireAgencyAdmin } from "@/lib/agency-auth"
import { agencyLogout } from "@/lib/actions/agency-auth"
import { AgencyJobForm } from "@/components/agency/agency-job-form"
import { redirect } from "next/navigation"
import { LogOut, ArrowLeft, Briefcase, LayoutDashboard } from "lucide-react"

export default async function AgencyJobNewPage() {
  const agency = await requireAgencyAdmin()

  async function handleLogout() {
    "use server"
    await agencyLogout()
    redirect("/agency/login")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div>
            <h1 className="text-lg font-bold">{agency.name}</h1>
            <p className="text-xs text-muted-foreground">{agency.email}</p>
          </div>
          <nav className="hidden sm:flex items-center gap-4 text-sm">
            <Link href="/agency/dashboard" className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground">
              <LayoutDashboard className="h-4 w-4" />
              ダッシュボード
            </Link>
            <Link href="/agency/jobs" className="flex items-center gap-1.5 font-medium text-foreground">
              <Briefcase className="h-4 w-4" />
              案件管理
            </Link>
          </nav>
        </div>
        <form action={handleLogout}>
          <button type="submit" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <LogOut className="h-4 w-4" />
            ログアウト
          </button>
        </form>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-8 space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/agency/jobs" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h2 className="text-xl font-bold">案件新規作成</h2>
        </div>

        <div className="rounded-xl border bg-white p-6">
          <AgencyJobForm />
        </div>
      </main>
    </div>
  )
}
