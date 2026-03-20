import { prisma } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { JobForm } from "@/components/admin/job-form"

export default async function NewJobPage() {
  const clients = await prisma.client.findMany({
    orderBy: { companyName: "asc" },
    select: { id: true, companyName: true },
  })

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">案件新規作成</h1>
      <Card>
        <CardHeader>
          <CardTitle>案件情報</CardTitle>
        </CardHeader>
        <CardContent>
          <JobForm clients={clients} />
        </CardContent>
      </Card>
    </div>
  )
}
