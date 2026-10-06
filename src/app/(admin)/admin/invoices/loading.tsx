import { PANEL } from "@/components/admin/styles"

function Bone({ className }: { className: string }) {
  return <div className={`animate-pulse rounded bg-neutral-100 ${className}`} />
}

export default function InvoicesLoading() {
  return (
    <div className="space-y-6">
      <div>
        <Bone className="h-8 w-40" />
        <Bone className="mt-2 h-4 w-96 max-w-full" />
      </div>
      <Bone className="h-[84px] w-full rounded-xl" />
      <div className="flex gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Bone key={i} className="h-8 w-16 shrink-0 rounded-full" />
        ))}
      </div>
      <div className={`${PANEL} divide-y divide-neutral-100`}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4">
            <div className="space-y-2">
              <Bone className="h-4 w-56" />
              <Bone className="h-3 w-24" />
            </div>
            <Bone className="ml-auto h-6 w-16 rounded-full" />
            <Bone className="h-5 w-20" />
          </div>
        ))}
      </div>
    </div>
  )
}
