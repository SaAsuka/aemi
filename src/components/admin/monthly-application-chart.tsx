"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts"
import {
  AXIS_TICK,
  CURSOR_FILL,
  ChartEmpty,
  ChartLegend,
  ChartTooltip,
  GRID_STROKE,
} from "@/components/admin/chart-parts"

type DataPoint = {
  label: string
  応募中: number
  書類送付済: number
  合格: number
  不合格: number
  合計: number
}

// 合格＝緑・不合格＝赤。応募中（青）と書類送付済（黄）は「対応が必要なこと」のラベルと同じ色にそろえる
// （積み上げは下から。色覚の違いでも隣り合う色が見分けられることを確認済み）
const SERIES = [
  { key: "合格", color: "#15803d" },
  { key: "書類送付済", color: "#ca8a04" },
  { key: "応募中", color: "#2563eb" },
  { key: "不合格", color: "#dc2626" },
] as const

const HEIGHT = 250

export function MonthlyApplicationChart({ data }: { data: DataPoint[] }) {
  const isEmpty = data.every((d) => d.合計 === 0)

  return (
    // relative：読み上げ用の表（sr-only）がページ全体を伸ばさないよう、この枠の中に留める
    <div className="relative space-y-4">
      {!isEmpty && <ChartLegend items={SERIES.map((s) => ({ label: s.key, color: s.color }))} />}
      {isEmpty ? (
        <ChartEmpty height={HEIGHT} message="この6か月の応募はまだありません" />
      ) : (
        <ResponsiveContainer width="100%" height={HEIGHT}>
          <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke={GRID_STROKE} />
            <XAxis dataKey="label" height={24} tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: "#e5e5e5" }} />
            <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip
              cursor={{ fill: CURSOR_FILL }}
              content={({ active, payload, label }) => (
                <ChartTooltip
                  active={active}
                  payload={payload}
                  label={label}
                  unit="件"
                  total={(payload?.[0]?.payload as DataPoint | undefined)?.合計}
                />
              )}
            />
            {SERIES.map((s, i) => (
              <Bar
                key={s.key}
                dataKey={s.key}
                stackId="a"
                fill={s.color}
                stroke="#ffffff"
                strokeWidth={1}
                maxBarSize={24}
                radius={i === SERIES.length - 1 ? [4, 4, 0, 0] : 0}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      )}

      {/* 表に直接 sr-only を付けると高さが潰れず縦に伸びるので、div で包んで隠す */}
      <div className="sr-only">
        <table>
          <caption>月別の応募数（状況別）</caption>
          <thead>
            <tr>
              <th>月</th>
              {SERIES.map((s) => (
                <th key={s.key}>{s.key}</th>
              ))}
              <th>合計</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.label}>
                <th>{d.label}</th>
                {SERIES.map((s) => (
                  <td key={s.key}>{d[s.key]}件</td>
                ))}
                <td>{d.合計}件</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
