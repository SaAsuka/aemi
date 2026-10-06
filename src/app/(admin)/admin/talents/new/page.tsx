import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { TalentEditorForm } from "@/components/admin/talent-editor-form"

export default function NewTalentPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href="/admin/talents"
          className="-ml-1 inline-flex items-center gap-0.5 rounded-md px-1 py-0.5 text-sm text-neutral-500 transition-colors hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950/30"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
          タレント管理
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight text-neutral-950 sm:text-2xl">タレント新規登録</h1>
        <p className="mt-1 text-sm leading-relaxed text-neutral-500">
          事務所でタレントの情報を入力して登録します。
          <span className="inline-block">
            本人に入力してもらう場合は、タレント管理の「招待メール送信」か「登録フォームURL」をご利用ください。
          </span>
        </p>
      </div>
      <TalentEditorForm />
    </div>
  )
}
