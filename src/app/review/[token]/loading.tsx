import { Skeleton } from "@/components/ui/skeleton"

export default function ReviewLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
        <div className="text-center space-y-2">
          <Skeleton className="h-6 w-40 mx-auto" />
          <Skeleton className="h-4 w-56 mx-auto" />
        </div>

        <div className="flex justify-center">
          <Skeleton className="w-48 h-48 rounded-xl" />
        </div>

        <div className="text-center space-y-1">
          <Skeleton className="h-6 w-32 mx-auto" />
          <Skeleton className="h-4 w-24 mx-auto" />
        </div>

        <div className="rounded-lg border p-4 space-y-3">
          <Skeleton className="h-4 w-20" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex justify-between">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>

        <div className="rounded-lg border p-4 space-y-3">
          <Skeleton className="h-4 w-20" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex justify-between">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>

        <div className="rounded-lg border bg-white p-6 space-y-4">
          <Skeleton className="h-5 w-48 mx-auto" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-16 rounded-md" />
            <Skeleton className="h-16 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  )
}
