import { PANEL } from "@/components/admin/styles"

function Bone({ className }: { className: string }) {
  return <div className={`animate-pulse rounded bg-neutral-100 ${className}`} />
}

export default function TalentDetailLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Bone className="h-4 w-24" />
      <div className="flex items-start gap-5">
        <Bone className="size-20 rounded-xl sm:size-24" />
        <div className="space-y-2 pt-1">
          <Bone className="h-7 w-40" />
          <Bone className="h-4 w-48" />
          <div className="flex gap-1.5 pt-2">
            <Bone className="h-6 w-20 rounded-full" />
            <Bone className="h-6 w-24 rounded-full" />
            <Bone className="h-6 w-24 rounded-full" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-neutral-200 bg-neutral-200 sm:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className={`bg-white px-5 py-3.5 ${i === 4 ? "col-span-2 sm:col-span-1" : ""}`}>
            <Bone className="h-3 w-12" />
            <Bone className="mt-2 h-6 w-16" />
          </div>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className={`${PANEL} space-y-4 p-6`}>
          <Bone className="h-5 w-28" />
          {Array.from({ length: 4 }).map((_, i) => (
            <Bone key={i} className="h-10 w-full" />
          ))}
        </div>
        <div className={`${PANEL} space-y-3 p-6`}>
          <Bone className="h-5 w-24" />
          <Bone className="h-9 w-full" />
        </div>
      </div>
    </div>
  )
}
