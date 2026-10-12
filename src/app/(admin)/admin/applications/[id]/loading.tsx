import { PANEL } from "@/components/admin/styles"
import { Bone } from "@/components/admin/page-skeletons"

export default function ApplicationDetailLoading() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Bone className="h-5 w-24" />
      <div>
        <Bone className="h-6 w-16 rounded-full" />
        <Bone className="mt-3 h-8 w-72 max-w-full" />
        <Bone className="mt-3 h-4 w-96 max-w-full" />
      </div>
      <div className={`${PANEL} space-y-3 p-5 sm:p-6`}>
        <Bone className="h-5 w-24" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Bone key={i} className="h-12 w-full" />
        ))}
      </div>
    </div>
  )
}
