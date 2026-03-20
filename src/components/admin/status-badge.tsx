import { Badge } from "@/components/ui/badge"
import { STATUS_COLORS } from "@/types"

export function StatusBadge({
  status,
  label,
}: {
  status: string
  label: string
}) {
  const colorClass = STATUS_COLORS[status] ?? "bg-gray-100 text-gray-800"
  return (
    <Badge variant="outline" className={`${colorClass} border-0 font-medium`}>
      {label}
    </Badge>
  )
}
