import { PANEL } from "@/components/admin/styles"

function Bone({ className }: { className: string }) {
  return <div className={`animate-pulse rounded bg-neutral-100 ${className}`} />
}

export default function ProductionCompaniesLoading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Bone className="h-8 w-40" />
          <Bone className="mt-2 h-4 w-64" />
        </div>
        <div className="flex gap-2">
          <Bone className="h-10 flex-1 sm:h-9 sm:w-36" />
          <Bone className="h-10 flex-1 sm:h-9 sm:w-28" />
        </div>
      </div>
      <div className={`${PANEL} p-4 sm:p-5`}>
        <Bone className="h-3 w-32" />
        <Bone className="mt-2 h-9 w-full sm:max-w-md" />
      </div>
      <div className={`${PANEL} divide-y divide-neutral-100`}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4">
            <Bone className="size-10 rounded-lg" />
            <div className="space-y-2">
              <Bone className="h-4 w-48" />
              <Bone className="h-3 w-24" />
            </div>
            <Bone className="ml-auto h-6 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
