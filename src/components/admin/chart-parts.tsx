"use client"

// ダッシュボードのグラフで共通に使う部品（ツールチップ・凡例・データなし表示・軸の色）

export const AXIS_TICK = { fontSize: 12, fill: "#737373" }
export const GRID_STROKE = "#f0f0f0"
export const CURSOR_FILL = "#f5f5f5"

type TooltipItem = {
  name?: string | number
  value?: string | number | readonly (string | number)[]
  color?: string
  dataKey?: string | number | ((obj: unknown) => unknown)
}

export function ChartTooltip({
  active,
  payload,
  label,
  unit,
  total,
}: {
  active?: boolean
  payload?: readonly TooltipItem[]
  label?: string | number
  unit: string
  total?: number
}) {
  if (!active || !payload?.length) return null
  // 積み上げは上の段から順に読むので、表示も上から並べる
  const items = [...payload].reverse()
  return (
    <div className="min-w-[150px] rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-xs shadow-lg">
      <p className="mb-2 font-medium text-neutral-950">{label}</p>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li key={String(item.name)} className="flex items-center gap-2">
            <span className="size-2.5 shrink-0 rounded-[3px]" style={{ background: item.color }} />
            <span className="text-neutral-600">{item.name}</span>
            <span className="ml-auto pl-4 font-medium tabular-nums text-neutral-950">
              {String(item.value)}
              {unit}
            </span>
          </li>
        ))}
      </ul>
      {total !== undefined && (
        <p className="mt-2 flex border-t border-neutral-100 pt-2 text-neutral-600">
          合計
          <span className="ml-auto font-medium tabular-nums text-neutral-950">
            {total}
            {unit}
          </span>
        </p>
      )}
    </div>
  )
}

export function ChartLegend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-neutral-600">
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-[3px]" style={{ background: item.color }} />
          {item.label}
        </li>
      ))}
    </ul>
  )
}

export function ChartEmpty({ height, message }: { height: number; message: string }) {
  return (
    <div
      className="flex items-center justify-center rounded-lg bg-neutral-50 px-4 text-center text-sm text-neutral-500"
      style={{ height }}
    >
      {message}
    </div>
  )
}
