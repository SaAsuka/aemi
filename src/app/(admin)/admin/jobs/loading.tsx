import { PANEL } from "@/components/admin/styles"

function Bone({ className }: { className: string }) {
  return <div className={`animate-pulse rounded bg-neutral-100 ${className}`} />
}

export default function JobsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Bone className="h-8 w-28" />
          <Bone className="mt-2 h-4 w-36" />
        </div>
        <Bone className="h-9 w-full sm:w-80" />
      </div>
      <div className={`${PANEL} space-y-4 p-4 sm:p-5`}>
        <div className="flex flex-col gap-4 sm:flex-row">
          <Bone className="h-9 flex-1" />
          <Bone className="h-9 w-full sm:w-64" />
        </div>
        <div className="flex gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Bone key={i} className="h-8 w-16 rounded-full" />
          ))}
        </div>
      </div>
      <div className={`${PANEL} divide-y divide-neutral-100`}>
        <div className="px-5 py-3">
          <Bone className="h-4 w-40" />
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-6 px-5 py-4">
            <Bone className="h-4 w-56" />
            <Bone className="h-6 w-16 rounded-full" />
            <Bone className="hidden h-4 w-20 sm:block" />
            <Bone className="hidden h-4 w-24 sm:block" />
          </div>
        ))}
      </div>
    </div>
  )
}
