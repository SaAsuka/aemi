import { PANEL } from "@/components/admin/styles"
import { Bone } from "@/components/admin/page-skeletons"

export default function JobDetailLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Bone className="h-5 w-24" />
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <Bone className="h-6 w-16 rounded-full" />
          <Bone className="mt-3 h-8 w-72 max-w-full" />
          <Bone className="mt-3 h-4 w-96 max-w-full" />
        </div>
        <Bone className="h-10 w-full sm:h-9 sm:w-20" />
      </div>
      <Bone className="h-[76px] w-full rounded-xl" />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className={`${PANEL} space-y-3 p-5 sm:p-6`}>
          <Bone className="h-5 w-40" />
          {Array.from({ length: 4 }).map((_, i) => (
            <Bone key={i} className="h-12 w-full" />
          ))}
        </div>
        <div className={`${PANEL} space-y-3 p-5 sm:p-6`}>
          <Bone className="h-5 w-20" />
          {Array.from({ length: 3 }).map((_, i) => (
            <Bone key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
    </div>
  )
}
