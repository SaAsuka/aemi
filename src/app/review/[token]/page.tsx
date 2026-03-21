import { notFound } from "next/navigation"
import { getApplicationByToken } from "@/lib/actions/review"
import { TalentProfile } from "@/components/review/talent-profile"
import { ReviewForm } from "@/components/review/review-form"

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const app = await getApplicationByToken(token)

  if (!app) {
    notFound()
  }

  const isReviewed = !!app.reviewedAt

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
        <div className="text-center">
          <h1 className="text-lg font-bold">タレント情報確認</h1>
          <p className="text-sm text-muted-foreground mt-1">合否のご判断をお願いいたします</p>
        </div>

        <TalentProfile talent={app.talent} job={app.job} />

        <div className="rounded-lg border bg-white p-6">
          {isReviewed ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">📋</div>
              <h3 className="text-lg font-bold mb-2">ご回答ありがとうございました</h3>
              <p className="text-sm text-muted-foreground">既に回答済みです。</p>
            </div>
          ) : (
            <ReviewForm token={token} />
          )}
        </div>
      </div>
    </div>
  )
}
