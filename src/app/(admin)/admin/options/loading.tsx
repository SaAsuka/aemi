import { PANEL } from "@/components/admin/styles"

function Bone({ className }: { className: string }) {
  return <div className={`animate-pulse rounded bg-neutral-100 ${className}`} />
}

export default function OptionsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Bone className="h-8 w-40" />
          <Bone className="mt-2 h-4 w-72" />
        </div>
        <Bone className="h-9 w-full sm:w-28" />
      </div>
      <div className={`${PANEL} space-y-4 p-4 sm:p-5`}>
        <Bone className="h-9 w-full sm:max-w-md" />
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Bone key={i} className="h-8 w-16 rounded-full" />
          ))}
        </div>
      </div>
      <div className={`${PANEL} divide-y divide-neutral-100`}>
        <div className="px-5 py-3">
          <Bone className="h-4 w-40" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4">
            <Bone className="size-11 rounded-lg" />
            <div className="space-y-2">
              <Bone className="h-4 w-48" />
              <Bone className="h-3 w-16" />
            </div>
            <Bone className="ml-auto h-6 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
