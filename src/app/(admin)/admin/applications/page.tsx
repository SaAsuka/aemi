import { Suspense } from "react"
import { getApplications, getApplicationCount } from "@/lib/actions/application"
import { getActiveTalentOptions, getOpenJobOptions } from "@/lib/queries"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusFilter } from "@/components/admin/status-filter"
import { NewApplicationDialog } from "@/components/admin/new-application-dialog"
import { Button } from "@/components/ui/button"
import { CsvExportButton } from "@/components/admin/csv-export-button"
import { exportApplicationsCsv } from "@/lib/actions/export"
import { ApplicationTable } from "@/components/admin/application-table"

async function ApplicationDialogData() {
  const [talents, jobs] = await Promise.all([
    getActiveTalentOptions(),
    getOpenJobOptions(),
  ])
  return <NewApplicationDialog talents={talents} jobs={jobs} />
}

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; sort?: string; order?: string; page?: string }>
}) {
  const { status, sort, order, page } = await searchParams
  const [applications, totalCount] = await Promise.all([
    getApplications(status, undefined, sort, order, page ? Number(page) : 1),
    getApplicationCount(status),
  ])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl sm:text-2xl font-bold">応募管理</h1>
        <div className="flex items-center gap-2">
          <CsvExportButton action={exportApplicationsCsv} filename="応募一覧.csv" />
          <Suspense fallback={<Button variant="outline" size="sm" disabled>新規応募</Button>}>
            <ApplicationDialogData />
          </Suspense>
        </div>
      </div>

      <StatusFilter
        options={[
          { value: "ALL", label: "すべて" },
          { value: "APPLIED", label: "応募済み" },
          { value: "RESUME_SENT", label: "書類送付済" },
          { value: "ACCEPTED", label: "合格" },
          { value: "REJECTED", label: "不合格" },
          { value: "AUTO_REJECTED", label: "自動不合格" },
          { value: "CANCELLED", label: "キャンセル" },
        ]}
        defaultValue={status}
      />

      <Card>
        <CardHeader>
          <CardTitle>応募一覧（{totalCount}件）</CardTitle>
        </CardHeader>
        <CardContent>
          <ApplicationTable applications={applications} totalCount={totalCount} />
        </CardContent>
      </Card>
    </div>
  )
}
