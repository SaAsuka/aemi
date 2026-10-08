import { PANEL } from "@/components/admin/styles"

function Bone({ className }: { className: string }) {
  return <div className={`animate-pulse rounded bg-neutral-100 ${className}`} />
}

export default function TalentsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <Bone className="h-8 w-36" />
          <Bone className="mt-2 h-4 w-28" />
        </div>
        <Bone className="h-9 w-full sm:w-96" />
      </div>
      <div className={`${PANEL} space-y-4 p-4 sm:p-5`}>
        <Bone className="h-10 w-full" />
        <div className="flex gap-3">
          <Bone className="h-9 w-40" />
          <Bone className="h-9 w-40" />
        </div>
      </div>
      <div className={`${PANEL} divide-y divide-neutral-100`}>
        <div className="px-5 py-3">
          <Bone className="h-4 w-48" />
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-6 px-5 py-4">
            <div className="w-40 space-y-2">
              <Bone className="h-4 w-24" />
              <Bone className="h-3 w-20" />
            </div>
            <Bone className="h-4 w-16" />
            <Bone className="hidden h-4 w-16 sm:block" />
            <Bone className="hidden h-4 w-16 sm:block" />
          </div>
        ))}
      </div>
    </div>
  )
}
