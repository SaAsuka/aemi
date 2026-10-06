import { PANEL } from "@/components/admin/styles"

function Bone({ className }: { className: string }) {
  return <div className={`animate-pulse rounded bg-neutral-100 ${className}`} />
}

export default function ScheduleLoading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Bone className="h-8 w-36" />
          <Bone className="mt-2 h-4 w-72" />
        </div>
        <Bone className="h-9 w-full sm:w-32" />
      </div>
      <div className={`${PANEL} space-y-4 p-4 sm:p-5`}>
        <Bone className="h-9 w-72" />
        <div className="flex gap-3">
          <Bone className="h-9 w-60" />
          <Bone className="h-9 w-72" />
        </div>
      </div>
      <div className={PANEL}>
        <div className="px-5 py-3">
          <Bone className="h-4 w-40" />
        </div>
        <div className="hidden grid-cols-7 gap-px bg-neutral-100 md:grid">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="h-28 bg-white p-2">
              <Bone className="size-6 rounded-full" />
            </div>
          ))}
        </div>
        <div className="space-y-3 p-4 md:hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <Bone key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    </div>
  )
}
