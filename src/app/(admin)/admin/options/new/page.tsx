import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { OptionEditorForm } from "@/components/admin/option-editor-form"

export default function NewOptionPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href="/admin/options"
          className="-ml-1 inline-flex items-center gap-0.5 rounded-md px-1 py-0.5 text-sm text-neutral-500 transition-colors hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950/30"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
          オプション管理
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight text-neutral-950 sm:text-2xl">オプションの新規作成</h1>
        <p className="mt-1 text-sm leading-relaxed text-neutral-500">
          タレントが購入できる撮影・レッスンなどを登録します。
          <span className="inline-block">「必須」はオプション名と価格だけです。</span>
        </p>
      </div>
      <OptionEditorForm />
    </div>
  )
}
