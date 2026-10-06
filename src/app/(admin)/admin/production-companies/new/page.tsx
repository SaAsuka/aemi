import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { isFreeeConnected } from "@/lib/freee"
import { CompanyEditorForm } from "@/components/admin/company-editor-form"

export default async function NewProductionCompanyPage() {
  const freeeConnected = await isFreeeConnected()

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href="/admin/production-companies"
          className="-ml-1 inline-flex items-center gap-0.5 rounded-md px-1 py-0.5 text-sm text-neutral-500 transition-colors hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950/30"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
          制作会社管理
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight text-neutral-950 sm:text-2xl">制作会社の新規登録</h1>
        <p className="mt-1 text-sm leading-relaxed text-neutral-500">
          請求書の宛先になる制作会社を登録します。
        </p>
      </div>
      <CompanyEditorForm freeeConnected={freeeConnected} />
    </div>
  )
}
