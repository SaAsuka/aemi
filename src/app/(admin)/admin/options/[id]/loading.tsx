import { PANEL } from "@/components/admin/styles"

function Bone({ className }: { className: string }) {
  return <div className={`animate-pulse rounded bg-neutral-100 ${className}`} />
}

export default function OptionDetailLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Bone className="h-5 w-28" />
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex gap-4">
          <Bone className="aspect-video w-24 shrink-0 rounded-xl sm:w-48" />
          <div>
            <Bone className="h-6 w-32" />
            <Bone className="mt-3 h-8 w-64" />
            <Bone className="mt-3 h-4 w-80 max-w-full" />
          </div>
        </div>
        <Bone className="h-10 w-full sm:h-9 sm:w-20" />
      </div>
      <Bone className="h-[76px] w-full rounded-xl" />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className={`${PANEL} space-y-3 p-5 sm:p-6`}>
          <Bone className="h-5 w-40" />
          {Array.from({ length: 4 }).map((_, i) => (
            <Bone key={i} className="h-10 w-full" />
          ))}
        </div>
        <div className={`${PANEL} space-y-3 p-5 sm:p-6`}>
          <Bone className="h-5 w-32" />
          <Bone className="h-16 w-full" />
        </div>
      </div>
    </div>
  )
}
