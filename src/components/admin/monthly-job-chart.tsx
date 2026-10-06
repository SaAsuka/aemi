"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  LabelList,
} from "recharts"
import { AXIS_TICK, CURSOR_FILL, ChartEmpty, ChartTooltip, GRID_STROKE } from "@/components/admin/chart-parts"

type DataPoint = {
  label: string
  案件数: number
}

const HEIGHT = 200

export function MonthlyJobChart({ data }: { data: DataPoint[] }) {
  const isEmpty = data.every((d) => d.案件数 === 0)
  // 0件の月は棒が描かれず番号がずれるので、月の名前で今月を見分ける
  const currentLabel = data[data.length - 1]?.label

  return (
    // relative：読み上げ用の表（sr-only）がページ全体を伸ばさないよう、この枠の中に留める
    <div className="relative">
      {isEmpty ? (
        <ChartEmpty height={HEIGHT} message="この6か月の新規案件はまだありません" />
      ) : (
        <ResponsiveContainer width="100%" height={HEIGHT}>
          <BarChart data={data} margin={{ top: 20, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke={GRID_STROKE} />
            <XAxis dataKey="label" height={24} tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: "#e5e5e5" }} />
            <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip
              cursor={{ fill: CURSOR_FILL }}
              content={({ active, payload, label }) => (
                <ChartTooltip active={active} payload={payload} label={label} unit="件" />
              )}
            />
            <Bar dataKey="案件数" fill="#0a0a0a" maxBarSize={24} radius={[4, 4, 0, 0]}>
              {/* 今月の値だけ棒の上に出す */}
              <LabelList
                valueAccessor={(entry: { payload?: DataPoint }) =>
                  entry.payload?.label === currentLabel ? entry.payload.案件数 : undefined
                }
                content={({ viewBox, value }) => {
                  if (value == null || !viewBox || !("width" in viewBox)) return null
                  const { x = 0, y = 0, width = 0 } = viewBox
                  return (
                    <text
                      x={Number(x) + Number(width) / 2}
                      y={Number(y) - 6}
                      textAnchor="middle"
                      fontSize={12}
                      fontWeight={600}
                      fill="#0a0a0a"
                    >
                      {String(value)}件
                    </text>
                  )
                }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}

      {/* 表に直接 sr-only を付けると高さが潰れず縦に伸びるので、div で包んで隠す */}
      <div className="sr-only">
        <table>
          <caption>月別の新規案件数</caption>
          <tbody>
            {data.map((d) => (
              <tr key={d.label}>
                <th>{d.label}</th>
                <td>{d.案件数}件</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
