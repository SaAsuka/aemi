import { SUBMISSION_CATEGORY_LABELS } from "@/types"

type Submission = {
  id: string
  category: string
  fileUrl: string | null
  externalUrl: string | null
  fileName: string | null
}

export function SubmissionLinks({ submissions }: { submissions: Submission[] }) {
  if (submissions.length === 0) return <span className="text-muted-foreground text-xs">なし</span>

  return (
    <div className="flex flex-wrap gap-1">
      {submissions.map((sub) => {
        const url = sub.fileUrl ?? sub.externalUrl
        if (!url) return null
        return (
          <a
            key={sub.id}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700 hover:bg-blue-100 transition-colors"
            title={sub.fileName ?? url}
          >
            {SUBMISSION_CATEGORY_LABELS[sub.category] ?? sub.category}
          </a>
        )
      })}
    </div>
  )
}
