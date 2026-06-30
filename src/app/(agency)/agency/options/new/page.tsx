import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AgencyOptionForm } from "@/components/agency/agency-option-form"

export default function AgencyOptionNewPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/agency/options" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-bold">オプション新規作成</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>オプション情報</CardTitle>
        </CardHeader>
        <CardContent>
          <AgencyOptionForm />
        </CardContent>
      </Card>
    </div>
  )
}
