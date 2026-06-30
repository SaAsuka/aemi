import { Suspense } from "react"
import { requireAgencyAdmin } from "@/lib/agency-auth"
import { getAgencyApplications, getAgencyApplicationCount } from "@/lib/actions/agency-application"
import { getAgencyActiveTalentOptions, getAgencyOpenJobOptions } from "@/lib/agency-queries"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusFilter } from "@/components/admin/status-filter"
import { TalentFilter } from "@/components/admin/talent-filter"
import { AgencyNewApplicationDialog } from "@/components/agency/agency-new-application-dialog"
import { AgencyApplicationTable } from "@/components/agency/agency-application-table"
import { Button } from "@/components/ui/button"

async function ApplicationDialogData({ agencyId }: { agencyId: string }) {
  const [talents, jobs] = await Promise.all([
    getAgencyActiveTalentOptions(agencyId),
    getAgencyOpenJobOptions(agencyId),
  ])
  return <AgencyNewApplicationDialog talents={talents} jobs={jobs} />
}

export default async function AgencyApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; sort?: string; order?: string; page?: string; talentId?: string }>
}) {
  const agency = await requireAgencyAdmin()
  const { status, sort, order, page, talentId } = await searchParams
  const [applications, totalCount, talents] = await Promise.all([
    getAgencyApplications(agency.id, status, undefined, sort, order, page ? Number(page) : 1, talentId),
    getAgencyApplicationCount(agency.id, status, undefined, talentId),
    getAgencyActiveTalentOptions(agency.id),
  ])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl sm:text-2xl font-bold">応募管理</h1>
        <div className="flex items-center gap-2">
          <Suspense fallback={<Button variant="outline" size="sm" disabled>新規応募</Button>}>
            <ApplicationDialogData agencyId={agency.id} />
          </Suspense>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
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
        <TalentFilter talents={talents} defaultValue={talentId} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>応募一覧（{totalCount}件）</CardTitle>
        </CardHeader>
        <CardContent>
          <AgencyApplicationTable applications={applications} totalCount={totalCount} />
        </CardContent>
      </Card>
    </div>
  )
}
