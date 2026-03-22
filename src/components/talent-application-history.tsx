import Link from "next/link"
import { Badge } from "@/components/ui/badge"

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  APPLIED: { label: "応募済み", variant: "default" },
  RESUME_SENT: { label: "書類送付済", variant: "secondary" },
  ACCEPTED: { label: "合格", variant: "default" },
  REJECTED: { label: "不合格", variant: "destructive" },
  CANCELLED: { label: "キャンセル", variant: "outline" },
  AUTO_REJECTED: { label: "自動不合格", variant: "destructive" },
}

type Application = {
  id: string
  status: string
  appliedAt: Date
  job: {
    id: string
    title: string
  }
}

export function TalentApplicationHistory({ applications }: { applications: Application[] }) {
  if (applications.length === 0) {
    return <p className="text-sm text-muted-foreground">応募履歴はありません</p>
  }

  return (
    <div className="space-y-3">
      {applications.map((app) => {
        const s = statusLabels[app.status] ?? { label: app.status, variant: "outline" as const }
        return (
          <div key={app.id} className="flex items-center justify-between border rounded-lg p-3">
            <div className="space-y-1">
              <Link href={`/jobs/${app.job.id}`} className="text-sm font-medium hover:underline">
                {app.job.title}
              </Link>
              <p className="text-xs text-muted-foreground">
                {new Date(app.appliedAt).toLocaleDateString("ja-JP")}
              </p>
            </div>
            <Badge variant={s.variant}>{s.label}</Badge>
          </div>
        )
      })}
    </div>
  )
}
