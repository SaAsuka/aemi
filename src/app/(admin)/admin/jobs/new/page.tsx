import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { JobEditorForm } from "@/components/admin/job-editor-form"

export default function NewJobPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href="/admin/jobs"
          className="-ml-1 inline-flex items-center gap-0.5 rounded-md px-1 py-0.5 text-sm text-neutral-500 transition-colors hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950/30"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
          案件管理
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight text-neutral-950 sm:text-2xl">案件の新規作成</h1>
        <p className="mt-1 text-sm leading-relaxed text-neutral-500">
          案件の内容を入力して作成します。
          <span className="inline-block">
            キャスティング会社からのメールがある場合は、案件管理の「テキストから登録」を使うと自動で読み取れます。
          </span>
        </p>
      </div>
      <JobEditorForm />
    </div>
  )
}
